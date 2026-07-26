import "server-only";

import { load, type CheerioAPI } from "cheerio";

import type { ArticleInsert, Source } from "@/lib/supabase/types";
import type {
  ArticleRejectionReason,
  ParsedArticleResult,
  SourceStrategy,
} from "@/lib/scraping/types";
import {
  normalizeArticleAssetUrl,
  normalizeCandidateUrl,
} from "@/lib/scraping/url";

const GENERIC_BODY_SELECTORS = [
  "article [itemprop='articleBody'] p",
  "[itemprop='articleBody'] p",
  "article p",
  "main article p",
] as const;

const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "iframe",
  "nav",
  "header",
  "footer",
  "form",
  "aside",
  "[role='navigation']",
  "[aria-hidden='true']",
  "[class*='advert' i]",
  "[class*='promo' i]",
  "[class*='newsletter' i]",
  "[class*='subscribe' i]",
  "[class*='related' i]",
  "[class*='recommend' i]",
  "[class*='most-viewed' i]",
  "[class*='social' i]",
  "[class*='share' i]",
  "[class*='caption' i]",
  "[data-testid*='advert' i]",
  "[data-testid*='related' i]",
].join(",");

const BOILERPLATE_PHRASES = [
  "advertisement",
  "all rights reserved",
  "click here",
  "follow us",
  "most read",
  "most viewed",
  "read more",
  "related content",
  "sign up",
  "subscribe",
];

const GENERIC_TITLES = [
  "bbc news",
  "fox news",
  "npr",
  "reuters",
  "the guardian",
  "world news",
  "latest news",
  "breaking news",
  "live updates",
];

type JsonLdRecord = Record<string, unknown>;

function normalizeText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
}

function metaContent($: CheerioAPI, selectors: readonly string[]) {
  for (const selector of selectors) {
    const content = $(selector).first().attr("content")?.trim();
    if (content) return content;
  }
}

function collectJsonLdRecords(value: unknown, output: JsonLdRecord[]) {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdRecords(item, output);
    return;
  }
  if (!value || typeof value !== "object") return;

  const record = value as JsonLdRecord;
  output.push(record);
  if ("@graph" in record) collectJsonLdRecords(record["@graph"], output);
}

function getArticleJsonLd($: CheerioAPI): JsonLdRecord | undefined {
  const records: JsonLdRecord[] = [];
  $("script[type='application/ld+json']").each((_, element) => {
    const raw = $(element).text();
    if (!raw || raw.length > 1_000_000) return;
    try {
      collectJsonLdRecords(JSON.parse(raw), records);
    } catch {
      // Ignore invalid metadata and continue with DOM fallbacks.
    }
  });

  return records.find((record) => {
    const type = record["@type"];
    const types = Array.isArray(type) ? type : [type];
    return types.some(
      (entry) =>
        typeof entry === "string" &&
        ["article", "newsarticle", "reportagenewsarticle"].includes(
          entry.toLowerCase(),
        ),
    );
  });
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function imageFromJsonLd(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = imageFromJsonLd(item);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    const record = value as JsonLdRecord;
    return stringValue(record.url) ?? stringValue(record.contentUrl);
  }
}

function extractParagraphs(
  $: CheerioAPI,
  strategy: SourceStrategy,
  articleBody?: string,
): string[] {
  $(REMOVE_SELECTORS).remove();
  const paragraphs: string[] = [];
  const seen = new Set<string>();

  const selectors = [...strategy.articleBodySelectors, ...GENERIC_BODY_SELECTORS];
  for (const selector of selectors) {
    $(selector).each((_, element) => {
      const text = normalizeText($(element).text());
      if (
        text.length < 40 ||
        seen.has(text) ||
        BOILERPLATE_PHRASES.some((phrase) =>
          text.toLowerCase().startsWith(phrase),
        )
      ) {
        return;
      }
      seen.add(text);
      paragraphs.push(text);
    });
    if (paragraphs.length >= 3) break;
  }

  if (paragraphs.length === 0 && articleBody) {
    const normalizedBody = normalizeText(articleBody);
    const chunks = normalizedBody
      .split(/(?:\n{2,}|(?<=[.!?])\s+(?=[A-Z“"']))/)
      .map(normalizeText)
      .filter((text) => text.length >= 40);
    paragraphs.push(...chunks);
  }

  return paragraphs;
}

function isBoilerplateDominated(paragraphs: readonly string[]): boolean {
  if (paragraphs.length === 0) return true;
  const suspicious = paragraphs.filter((paragraph) => {
    const lower = paragraph.toLowerCase();
    return BOILERPLATE_PHRASES.some((phrase) => lower.includes(phrase));
  }).length;
  return suspicious / paragraphs.length > 0.35;
}

function invalid(reason: ArticleRejectionReason): ParsedArticleResult {
  return { ok: false, reason };
}

export function parseArticleDetail(
  html: string,
  originalUrl: string,
  source: Pick<Source, "id">,
  strategy: SourceStrategy,
): ParsedArticleResult {
  const $ = load(html);
  const jsonLd = getArticleJsonLd($);

  const title = normalizeText(
    stringValue(jsonLd?.headline) ??
      metaContent($, [
        "meta[property='og:title']",
        "meta[name='twitter:title']",
      ]) ??
      $("article h1, main h1, h1").first().text(),
  );
  if (!title) return invalid("missing_title");
  if (
    title.length < 15 ||
    GENERIC_TITLES.includes(title.toLowerCase()) ||
    !/[a-z0-9]/i.test(title)
  ) {
    return invalid("generic_title");
  }

  const canonicalRaw =
    stringValue(jsonLd?.url) ??
    $("link[rel='canonical']").first().attr("href")?.trim() ??
    metaContent($, ["meta[property='og:url']"]) ??
    originalUrl;
  const canonical = normalizeCandidateUrl(
    canonicalRaw,
    originalUrl,
    strategy,
  );
  if (!canonical) return invalid("invalid_canonical_url");
  if (!strategy.isArticlePath(canonical)) {
    return invalid("non_article_canonical_url");
  }

  const imageRaw =
    imageFromJsonLd(jsonLd?.image) ??
    metaContent($, [
      "meta[property='og:image']",
      "meta[name='twitter:image']",
      "meta[property='twitter:image']",
    ]);
  const imageUrl = normalizeArticleAssetUrl(imageRaw, originalUrl);
  if (!imageUrl) return invalid("missing_image");

  const publishedRaw =
    stringValue(jsonLd?.datePublished) ??
    metaContent($, [
      "meta[property='article:published_time']",
      "meta[name='article:published_time']",
      "meta[name='date']",
      "meta[name='parsely-pub-date']",
    ]) ??
    $("time[datetime]").first().attr("datetime")?.trim();
  if (!publishedRaw) return invalid("missing_published_date");

  const publishedDate = new Date(publishedRaw);
  if (
    Number.isNaN(publishedDate.getTime()) ||
    publishedDate.getTime() > Date.now() + 24 * 60 * 60 * 1000
  ) {
    return invalid("invalid_published_date");
  }

  const paragraphs = extractParagraphs(
    $,
    strategy,
    stringValue(jsonLd?.articleBody),
  );
  const rawText = paragraphs.join("\n\n").trim();
  if (paragraphs.length < 3 && rawText.length < 900) {
    return invalid("insufficient_body");
  }
  if (isBoilerplateDominated(paragraphs)) {
    return invalid("boilerplate_body");
  }

  const article: ArticleInsert = {
    analyzed_at: null,
    canonical_url: canonical.toString(),
    image_url: imageUrl,
    original_url: originalUrl,
    published_at: publishedDate.toISOString(),
    raw_text: rawText,
    scraped_at: new Date().toISOString(),
    source_id: source.id,
    title,
  };

  return { article, ok: true, paragraphCount: paragraphs.length };
}
