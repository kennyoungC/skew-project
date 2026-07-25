import "server-only";

import type { SourceStrategy } from "@/lib/scraping/types";

const COMMON_REJECT_SEGMENTS = [
  "about",
  "account",
  "audio",
  "author",
  "authors",
  "category",
  "contact",
  "games",
  "help",
  "live",
  "menu",
  "newsletter",
  "newsletters",
  "podcast",
  "podcasts",
  "privacy",
  "search",
  "shop",
  "shopping",
  "show",
  "shows",
  "subscribe",
  "subscription",
  "tag",
  "tags",
  "terms",
  "topic",
  "topics",
  "video",
  "videos",
  "watch",
] as const;

function containsRejectedSegment(url: URL): boolean {
  const segments = url.pathname
    .toLowerCase()
    .split("/")
    .filter(Boolean);
  return COMMON_REJECT_SEGMENTS.some((segment) => segments.includes(segment));
}

const strategies: Record<string, SourceStrategy> = {
  "BBC News": {
    allowedHosts: ["bbc.com", "www.bbc.com", "bbc.co.uk", "www.bbc.co.uk"],
    articleBodySelectors: [
      "article [data-component='text-block'] p",
      "article [data-component='text-block']",
      "main article p",
    ],
    isArticlePath(url) {
      if (containsRejectedSegment(url)) return false;
      return (
        /^\/news\/articles\/[a-z0-9]+\/?$/i.test(url.pathname) ||
        /^\/news\/[a-z0-9-]+-\d{6,}\/?$/i.test(url.pathname)
      );
    },
    sourceName: "BBC News",
  },
  "Fox News": {
    allowedHosts: ["foxnews.com", "www.foxnews.com"],
    articleBodySelectors: [
      "article .article-body p",
      "article .article-content p",
      ".article-body p",
      "main article p",
    ],
    isArticlePath(url) {
      if (containsRejectedSegment(url)) return false;
      const segments = url.pathname.split("/").filter(Boolean);
      const allowedSections = new Set([
        "entertainment",
        "health",
        "lifestyle",
        "media",
        "politics",
        "science",
        "sports",
        "tech",
        "us",
        "world",
      ]);
      return (
        segments.length >= 2 &&
        allowedSections.has(segments[0]?.toLowerCase()) &&
        segments.at(-1)!.length >= 20
      );
    },
    sourceName: "Fox News",
  },
  NPR: {
    allowedHosts: ["npr.org", "www.npr.org"],
    articleBodySelectors: [
      "article .storytext p",
      "article .story-text p",
      "#storytext p",
      "main article p",
    ],
    isArticlePath(url) {
      if (containsRejectedSegment(url)) return false;
      return (
        /^\/\d{4}\/\d{2}\/\d{2}\/\d+\/[^/]+\/?$/i.test(url.pathname) ||
        /^\/nx-s1-\d+\/[^/]+\/?$/i.test(url.pathname)
      );
    },
    sourceName: "NPR",
  },
  Reuters: {
    allowedHosts: ["reuters.com", "www.reuters.com"],
    articleBodySelectors: [
      "article [data-testid='paragraph']",
      "article p",
      "main [data-testid='paragraph']",
    ],
    isArticlePath(url) {
      if (containsRejectedSegment(url)) return false;
      return /^\/[a-z0-9-]+(?:\/[a-z0-9-]+)+-\d{4}-\d{2}-\d{2}\/?$/i.test(
        url.pathname,
      );
    },
    sourceName: "Reuters",
  },
  "The Guardian": {
    allowedHosts: ["theguardian.com", "www.theguardian.com"],
    articleBodySelectors: [
      "#maincontent article p",
      "article [data-gu-name='body'] p",
      "article .article-body-commercial-selector p",
      "main article p",
    ],
    isArticlePath(url) {
      if (containsRejectedSegment(url)) return false;
      return /^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/\d{4}\/[a-z]{3}\/\d{1,2}\/[^/]+\/?$/i.test(
        url.pathname,
      );
    },
    sourceName: "The Guardian",
  },
};

export function getSourceStrategy(sourceName: string): SourceStrategy | null {
  return strategies[sourceName] ?? null;
}

