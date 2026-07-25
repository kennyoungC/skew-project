import "server-only";

import { scrapeHtmlWithOxylabs } from "@/lib/oxylabs/client";
import { extractHomepageCandidates } from "@/lib/scraping/homepage-parser";
import { parseArticleDetail } from "@/lib/scraping/article-parser";
import { getSourceStrategy } from "@/lib/scraping/source-strategies";
import {
  MAX_DETAIL_ATTEMPTS_PER_SOURCE,
  type ScrapePipelineInput,
  type ScrapeSummary,
  type SourceScrapeSummary,
} from "@/lib/scraping/types";
import {
  findExistingArticleUrls,
  insertArticlesAppendOnly,
} from "@/lib/supabase/queries/articles";
import { createLog } from "@/lib/supabase/queries/logs";
import { listActiveSources } from "@/lib/supabase/queries/sources";
import type { Json, Source } from "@/lib/supabase/types";

export class ScrapeSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScrapeSelectionError";
  }
}

function increment(reasons: Record<string, number>, reason: string, count = 1) {
  reasons[reason] = (reasons[reason] ?? 0) + count;
}

function jsonContext(value: Record<string, unknown>): Json {
  return value as Json;
}

async function logProgress(
  event: string,
  message: string,
  options: {
    context?: Record<string, unknown>;
    level?: "debug" | "info" | "warn" | "error";
    sourceId?: string;
  } = {},
) {
  const level = options.level ?? "info";
  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  method(`[scrape] ${message}`);

  try {
    await createLog({
      context: jsonContext(options.context ?? {}),
      event,
      level,
      message,
      source_id: options.sourceId,
    });
  } catch (error) {
    console.warn(
      `[scrape] Database log write failed for ${event}: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
  }
}

function resolveSelectedSources(
  activeSources: Source[],
  input: ScrapePipelineInput,
): Source[] {
  const requestedIds = new Set(input.sourceIds ?? []);
  const requestedNames = new Set(input.sourceNames ?? []);

  const missingIds = [...requestedIds].filter(
    (id) => !activeSources.some((source) => source.id === id),
  );
  const missingNames = [...requestedNames].filter(
    (name) => !activeSources.some((source) => source.name === name),
  );
  if (missingIds.length || missingNames.length) {
    throw new ScrapeSelectionError(
      "One or more requested sources are missing or inactive.",
    );
  }

  const selected = activeSources.filter(
    (source) =>
      (requestedIds.size === 0 || requestedIds.has(source.id)) &&
      (requestedNames.size === 0 || requestedNames.has(source.name)),
  );

  if (selected.length === 0) {
    throw new ScrapeSelectionError("No active sources matched the request.");
  }
  if (
    requestedIds.size > 0 &&
    requestedNames.size > 0 &&
    (selected.length !== requestedIds.size ||
      selected.length !== requestedNames.size)
  ) {
    throw new ScrapeSelectionError(
      "sourceIds and sourceNames must identify the same active sources.",
    );
  }

  return selected;
}

function newSourceSummary(source: Source): SourceScrapeSummary {
  return {
    articlesInserted: 0,
    candidatesFound: 0,
    detailPagesScraped: 0,
    duplicatesSkipped: 0,
    failed: 0,
    rejected: 0,
    sourceId: source.id,
    sourceName: source.name,
  };
}

export async function runManualScrapePipeline(
  input: ScrapePipelineInput,
): Promise<ScrapeSummary> {
  const startedAt = Date.now();
  const rejectionReasons: Record<string, number> = {};
  const activeSources = await listActiveSources();
  const sources = resolveSelectedSources(activeSources, input);
  const sourceSummaries: SourceScrapeSummary[] = [];
  const runSeenUrls = new Set<string>();
  let sourceFailures = 0;
  let candidatesFound = 0;
  let candidatesRejected = 0;
  let duplicatesSkipped = 0;
  let detailPagesScraped = 0;
  let articlesInserted = 0;
  let articlesRejected = 0;
  let articlesFailed = 0;

  await logProgress("scrape_started", "Scrape started.", {
    context: {
      limitPerSource: input.limitPerSource,
      sourceCount: sources.length,
    },
  });
  await logProgress(
    "scrape_sources_selected",
    `Selected sources: ${sources.map((source) => source.name).join(", ")}.`,
    { context: { sourceNames: sources.map((source) => source.name) } },
  );

  for (const source of sources) {
    const sourceSummary = newSourceSummary(source);
    sourceSummaries.push(sourceSummary);
    const strategy = getSourceStrategy(source.name);

    await logProgress("scrape_source_started", `${source.name}: started.`, {
      sourceId: source.id,
    });

    if (!strategy) {
      sourceFailures += 1;
      sourceSummary.failed += 1;
      articlesFailed += 1;
      increment(rejectionReasons, "unsupported_source");
      await logProgress(
        "scrape_source_failed",
        `${source.name}: no supported parser strategy.`,
        { level: "error", sourceId: source.id },
      );
      continue;
    }

    try {
      const homepageHtml = await scrapeHtmlWithOxylabs(source.listing_url);
      await logProgress(
        "scrape_homepage_fetched",
        `${source.name}: homepage fetched.`,
        { sourceId: source.id },
      );

      const extraction = extractHomepageCandidates(
        homepageHtml,
        source.listing_url,
        strategy,
      );
      sourceSummary.candidatesFound = extraction.found;
      sourceSummary.rejected += extraction.rejected;
      candidatesFound += extraction.found;
      candidatesRejected += extraction.rejected;
      for (const [reason, count] of Object.entries(
        extraction.rejectionReasons,
      )) {
        increment(rejectionReasons, reason, count);
      }

      await logProgress(
        "scrape_candidates_found",
        `${source.name}: found ${extraction.candidates.length} article candidates; rejected ${extraction.rejected} links before detail scraping.`,
        {
          context: {
            candidatesAccepted: extraction.candidates.length,
            candidatesFound: extraction.found,
            candidatesRejected: extraction.rejected,
          },
          sourceId: source.id,
        },
      );

      const existing = await findExistingArticleUrls(extraction.candidates);
      const candidates = extraction.candidates.filter((candidate) => {
        if (
          existing.originalUrls.has(candidate) ||
          existing.canonicalUrls.has(candidate) ||
          runSeenUrls.has(candidate)
        ) {
          sourceSummary.duplicatesSkipped += 1;
          duplicatesSkipped += 1;
          return false;
        }
        runSeenUrls.add(candidate);
        return true;
      });

      if (sourceSummary.duplicatesSkipped > 0) {
        await logProgress(
          "scrape_duplicates_skipped",
          `${source.name}: skipped ${sourceSummary.duplicatesSkipped} duplicate candidates.`,
          { sourceId: source.id },
        );
      }

      let attempts = 0;
      for (const candidate of candidates) {
        if (
          sourceSummary.articlesInserted >= input.limitPerSource ||
          attempts >= MAX_DETAIL_ATTEMPTS_PER_SOURCE
        ) {
          break;
        }
        attempts += 1;

        try {
          const articleHtml = await scrapeHtmlWithOxylabs(candidate);
          detailPagesScraped += 1;
          sourceSummary.detailPagesScraped += 1;

          const parsed = parseArticleDetail(
            articleHtml,
            candidate,
            source,
            strategy,
          );
          if (!parsed.ok) {
            articlesRejected += 1;
            sourceSummary.rejected += 1;
            increment(rejectionReasons, parsed.reason);
            continue;
          }

          const canonical = parsed.article.canonical_url;
          if (canonical) {
            const canonicalExisting = await findExistingArticleUrls([
              candidate,
              canonical,
            ]);
            if (
              canonicalExisting.originalUrls.size > 0 ||
              canonicalExisting.canonicalUrls.size > 0 ||
              (canonical !== candidate && runSeenUrls.has(canonical))
            ) {
              sourceSummary.duplicatesSkipped += 1;
              duplicatesSkipped += 1;
              continue;
            }
            runSeenUrls.add(canonical);
          }

          const inserted = await insertArticlesAppendOnly(parsed.article);
          if (inserted.length === 0) {
            sourceSummary.duplicatesSkipped += 1;
            duplicatesSkipped += 1;
            continue;
          }

          sourceSummary.articlesInserted += inserted.length;
          articlesInserted += inserted.length;
          await logProgress(
            "scrape_article_inserted",
            `${source.name}: inserted article ${sourceSummary.articlesInserted}/${input.limitPerSource}.`,
            {
              context: { articleId: inserted[0]?.id },
              sourceId: source.id,
            },
          );
        } catch {
          articlesFailed += 1;
          sourceSummary.failed += 1;
          increment(rejectionReasons, "detail_processing_failed");
        }
      }

      await logProgress(
        "scrape_source_completed",
        `${source.name}: ${sourceSummary.articlesInserted} inserted, ${sourceSummary.rejected} rejected, ${sourceSummary.failed} failed.`,
        {
          context: {
            articlesInserted: sourceSummary.articlesInserted,
            detailPagesScraped: sourceSummary.detailPagesScraped,
            duplicatesSkipped: sourceSummary.duplicatesSkipped,
            failed: sourceSummary.failed,
            rejected: sourceSummary.rejected,
          },
          sourceId: source.id,
        },
      );
    } catch {
      sourceFailures += 1;
      sourceSummary.failed += 1;
      articlesFailed += 1;
      increment(rejectionReasons, "source_processing_failed");
      await logProgress(
        "scrape_source_failed",
        `${source.name}: source processing failed.`,
        { level: "error", sourceId: source.id },
      );
    }
  }

  const allSourcesFailed = sourceFailures === sources.length;
  const hasPartialFailures =
    sourceFailures > 0 || articlesFailed > 0 || articlesRejected > 0;
  const summary: ScrapeSummary = {
    articlesFailed,
    articlesInserted,
    articlesRejected,
    candidatesFound,
    candidatesRejected,
    detailPagesScraped,
    duplicatesSkipped,
    durationMs: Date.now() - startedAt,
    rejectionReasons,
    sources: sourceSummaries,
    sourcesChecked: sources.length,
    status: allSourcesFailed
      ? "failed"
      : hasPartialFailures
        ? "partial"
        : "completed",
  };

  await logProgress(
    allSourcesFailed ? "scrape_failed" : "scrape_completed",
    `Scrape ${summary.status}: ${articlesInserted} articles inserted from ${sources.length} sources in ${summary.durationMs}ms.`,
    {
      context: {
        articlesFailed,
        articlesInserted,
        articlesRejected,
        candidatesFound,
        candidatesRejected,
        detailPagesScraped,
        duplicatesSkipped,
        durationMs: summary.durationMs,
        status: summary.status,
      },
      level: allSourcesFailed ? "error" : "info",
    },
  );

  return summary;
}

