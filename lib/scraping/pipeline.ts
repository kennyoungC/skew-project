import "server-only";

import { scrapeHtmlWithOxylabs } from "@/lib/oxylabs/client";
import {
  type ScrapePipelineInput,
  type ScrapeSummary,
  type SourceScrapeSummary,
} from "@/lib/scraping/types";
import { processSourceHomepageHtml } from "@/lib/scraping/source-processor";
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
    await logProgress("scrape_source_started", `${source.name}: started.`, {
      sourceId: source.id,
    });

    try {
      const homepageHtml = await scrapeHtmlWithOxylabs(source.listing_url);
      await logProgress(
        "scrape_homepage_fetched",
        `${source.name}: homepage fetched.`,
        { sourceId: source.id },
      );

      const result = await processSourceHomepageHtml({
        homepageHtml,
        limitPerSource: input.limitPerSource,
        onProgress: (event) =>
          logProgress(event.event, event.message, {
            context: event.context,
            level: event.level,
            sourceId: source.id,
          }),
        runSeenUrls,
        source,
      });
      const sourceSummary = result.source;
      sourceSummaries.push(sourceSummary);
      candidatesFound += result.candidatesFound;
      candidatesRejected += result.candidatesRejected;
      duplicatesSkipped += result.duplicatesSkipped;
      detailPagesScraped += result.detailPagesScraped;
      articlesInserted += result.articlesInserted;
      articlesRejected += result.articlesRejected;
      articlesFailed += result.articlesFailed;
      for (const [reason, count] of Object.entries(result.rejectionReasons)) {
        increment(rejectionReasons, reason, count);
      }
      if (result.rejectionReasons.unsupported_source) sourceFailures += 1;

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
      articlesFailed += 1;
      increment(rejectionReasons, "source_processing_failed");
      sourceSummaries.push({
        articlesInserted: 0,
        candidatesFound: 0,
        detailPagesScraped: 0,
        duplicatesSkipped: 0,
        failed: 1,
        rejected: 0,
        sourceId: source.id,
        sourceName: source.name,
      });
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
