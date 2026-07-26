import "server-only";

import { scrapeHtmlWithOxylabs } from "@/lib/oxylabs/client";
import { parseArticleDetail } from "@/lib/scraping/article-parser";
import { extractHomepageCandidates } from "@/lib/scraping/homepage-parser";
import { getSourceStrategy } from "@/lib/scraping/source-strategies";
import {
  MAX_DETAIL_ATTEMPTS_PER_SOURCE,
  type SourceScrapeSummary,
} from "@/lib/scraping/types";
import {
  findExistingArticleUrls,
  insertArticlesAppendOnly,
} from "@/lib/supabase/queries/articles";
import type { Source } from "@/lib/supabase/types";

export type SourceHomepageProcessResult = {
  articlesFailed: number;
  articlesInserted: number;
  articlesRejected: number;
  candidatesFound: number;
  candidatesRejected: number;
  detailPagesScraped: number;
  duplicatesSkipped: number;
  rejectionReasons: Record<string, number>;
  source: SourceScrapeSummary;
};

type ProgressEvent = {
  context?: Record<string, unknown>;
  event: string;
  level?: "debug" | "info" | "warn" | "error";
  message: string;
};

function increment(
  reasons: Record<string, number>,
  reason: string,
  count = 1,
): void {
  reasons[reason] = (reasons[reason] ?? 0) + count;
}

export async function processSourceHomepageHtml(options: {
  homepageHtml: string;
  limitPerSource: number;
  onProgress?: (event: ProgressEvent) => Promise<void>;
  runSeenUrls?: Set<string>;
  source: Pick<Source, "id" | "listing_url" | "name">;
}): Promise<SourceHomepageProcessResult> {
  const { homepageHtml, limitPerSource, onProgress, source } = options;
  const runSeenUrls = options.runSeenUrls ?? new Set<string>();
  const rejectionReasons: Record<string, number> = {};
  const sourceSummary: SourceScrapeSummary = {
    articlesInserted: 0,
    candidatesFound: 0,
    detailPagesScraped: 0,
    duplicatesSkipped: 0,
    failed: 0,
    rejected: 0,
    sourceId: source.id,
    sourceName: source.name,
  };
  const strategy = getSourceStrategy(source.name);

  if (!strategy) {
    increment(rejectionReasons, "unsupported_source");
    sourceSummary.failed = 1;
    return {
      articlesFailed: 1,
      articlesInserted: 0,
      articlesRejected: 0,
      candidatesFound: 0,
      candidatesRejected: 0,
      detailPagesScraped: 0,
      duplicatesSkipped: 0,
      rejectionReasons,
      source: sourceSummary,
    };
  }

  const extraction = extractHomepageCandidates(
    homepageHtml,
    source.listing_url,
    strategy,
  );
  sourceSummary.candidatesFound = extraction.found;
  sourceSummary.rejected = extraction.rejected;
  for (const [reason, count] of Object.entries(extraction.rejectionReasons)) {
    increment(rejectionReasons, reason, count);
  }

  await onProgress?.({
    context: {
      candidatesAccepted: extraction.candidates.length,
      candidatesFound: extraction.found,
      candidatesRejected: extraction.rejected,
    },
    event: "scrape_candidates_found",
    message: `${source.name}: found ${extraction.candidates.length} article candidates; rejected ${extraction.rejected} links before detail scraping.`,
  });

  const existing = await findExistingArticleUrls(extraction.candidates);
  const candidates = extraction.candidates.filter((candidate) => {
    if (
      existing.originalUrls.has(candidate) ||
      existing.canonicalUrls.has(candidate) ||
      runSeenUrls.has(candidate)
    ) {
      sourceSummary.duplicatesSkipped += 1;
      return false;
    }
    runSeenUrls.add(candidate);
    return true;
  });

  if (sourceSummary.duplicatesSkipped > 0) {
    await onProgress?.({
      event: "scrape_duplicates_skipped",
      message: `${source.name}: skipped ${sourceSummary.duplicatesSkipped} duplicate candidates.`,
    });
  }

  let articlesFailed = 0;
  let articlesRejected = 0;
  let attempts = 0;

  for (const candidate of candidates) {
    if (
      sourceSummary.articlesInserted >= limitPerSource ||
      attempts >= MAX_DETAIL_ATTEMPTS_PER_SOURCE
    ) {
      break;
    }
    attempts += 1;

    try {
      const articleHtml = await scrapeHtmlWithOxylabs(candidate);
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
          continue;
        }
        runSeenUrls.add(canonical);
      }

      const inserted = await insertArticlesAppendOnly(parsed.article);
      if (inserted.length === 0) {
        sourceSummary.duplicatesSkipped += 1;
        continue;
      }

      sourceSummary.articlesInserted += inserted.length;
      await onProgress?.({
        context: { articleId: inserted[0]?.id },
        event: "scrape_article_inserted",
        message: `${source.name}: inserted article ${sourceSummary.articlesInserted}/${limitPerSource}.`,
      });
    } catch {
      articlesFailed += 1;
      sourceSummary.failed += 1;
      increment(rejectionReasons, "detail_processing_failed");
    }
  }

  return {
    articlesFailed,
    articlesInserted: sourceSummary.articlesInserted,
    articlesRejected,
    candidatesFound: extraction.found,
    candidatesRejected: extraction.rejected,
    detailPagesScraped: sourceSummary.detailPagesScraped,
    duplicatesSkipped: sourceSummary.duplicatesSkipped,
    rejectionReasons,
    source: sourceSummary,
  };
}
