import type { ArticleInsert, Source } from "@/lib/supabase/types";

export const DEFAULT_LIMIT_PER_SOURCE = 5;
export const MAX_LIMIT_PER_SOURCE = 5;
export const MAX_CANDIDATES_PER_SOURCE = 40;
export const MAX_DETAIL_ATTEMPTS_PER_SOURCE = 20;

export type ScrapePipelineInput = {
  limitPerSource: number;
  sourceIds?: readonly string[];
  sourceNames?: readonly string[];
};

export type CandidateRejectionReason =
  | "empty_href"
  | "non_http_url"
  | "unsafe_hostname"
  | "off_domain"
  | "non_article_path"
  | "non_story_container"
  | "navigation_link"
  | "missing_headline";

export type ArticleRejectionReason =
  | "missing_title"
  | "generic_title"
  | "missing_image"
  | "missing_published_date"
  | "invalid_published_date"
  | "invalid_canonical_url"
  | "non_article_canonical_url"
  | "insufficient_body"
  | "boilerplate_body";

export type CandidateExtractionResult = {
  candidates: string[];
  found: number;
  rejectionReasons: Record<string, number>;
  rejected: number;
};

export type ParsedArticleResult =
  | { article: ArticleInsert; ok: true; paragraphCount: number }
  | { ok: false; reason: ArticleRejectionReason };

export type SourceScrapeSummary = {
  sourceId: string;
  sourceName: string;
  candidatesFound: number;
  detailPagesScraped: number;
  articlesInserted: number;
  duplicatesSkipped: number;
  rejected: number;
  failed: number;
};

export type ScrapeSummary = {
  status: "completed" | "partial" | "failed";
  sourcesChecked: number;
  candidatesFound: number;
  candidatesRejected: number;
  duplicatesSkipped: number;
  detailPagesScraped: number;
  articlesInserted: number;
  articlesRejected: number;
  articlesFailed: number;
  durationMs: number;
  rejectionReasons: Record<string, number>;
  sources: SourceScrapeSummary[];
};

export type SourceStrategy = {
  allowedHosts: readonly string[];
  articleBodySelectors: readonly string[];
  isArticlePath: (url: URL) => boolean;
  sourceName: Source["name"];
};

