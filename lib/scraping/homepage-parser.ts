import "server-only";

import { load } from "cheerio";

import type {
  CandidateExtractionResult,
  CandidateRejectionReason,
  SourceStrategy,
} from "@/lib/scraping/types";
import { MAX_CANDIDATES_PER_SOURCE } from "@/lib/scraping/types";
import { normalizeCandidateUrl } from "@/lib/scraping/url";

const STORY_CONTAINER_SELECTOR = [
  "article",
  "[data-testid*='card' i]",
  "[data-testid*='story' i]",
  "[class*='card' i]",
  "[class*='story' i]",
  "[class*='headline' i]",
  "[class*='promo' i]",
  "h2",
  "h3",
].join(",");

const FORBIDDEN_ANCESTOR_SELECTOR = [
  "nav",
  "header",
  "footer",
  "[role='navigation']",
  "[aria-label*='menu' i]",
  "[class*='menu' i]",
  "[class*='navigation' i]",
  "[class*='account' i]",
].join(",");

function addReason(
  reasons: Record<string, number>,
  reason: CandidateRejectionReason,
) {
  reasons[reason] = (reasons[reason] ?? 0) + 1;
}

export function extractHomepageCandidates(
  html: string,
  homepageUrl: string,
  strategy: SourceStrategy,
): CandidateExtractionResult {
  const $ = load(html);
  const candidates: string[] = [];
  const seen = new Set<string>();
  const rejectionReasons: Record<string, number> = {};
  let found = 0;

  $("a[href]").each((_, element) => {
    if (candidates.length >= MAX_CANDIDATES_PER_SOURCE) return false;

    const anchor = $(element);
    if (
      anchor.is("[hidden],[aria-hidden='true']") ||
      anchor.closest("[hidden],[aria-hidden='true']").length > 0
    ) {
      return;
    }

    const href = anchor.attr("href")?.trim();
    if (!href) {
      addReason(rejectionReasons, "empty_href");
      return;
    }

    const hasStoryContainer =
      anchor.is(STORY_CONTAINER_SELECTOR) ||
      anchor.find("h1,h2,h3").length > 0 ||
      anchor.closest(STORY_CONTAINER_SELECTOR).length > 0;
    if (!hasStoryContainer) return;

    found += 1;

    if (anchor.closest(FORBIDDEN_ANCESTOR_SELECTOR).length > 0) {
      addReason(rejectionReasons, "navigation_link");
      return;
    }

    const headline = anchor.text().replace(/\s+/g, " ").trim();
    if (headline.length < 12) {
      addReason(rejectionReasons, "missing_headline");
      return;
    }

    const url = normalizeCandidateUrl(href, homepageUrl, strategy);
    if (!url) {
      addReason(rejectionReasons, "off_domain");
      return;
    }
    if (!strategy.isArticlePath(url)) {
      addReason(rejectionReasons, "non_article_path");
      return;
    }

    const normalized = url.toString();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  });

  const rejected = Object.values(rejectionReasons).reduce(
    (total, count) => total + count,
    0,
  );

  return { candidates, found, rejected, rejectionReasons };
}

