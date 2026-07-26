import type { Framing } from "@/components/bias-meter";
import type { AnalyzedArticle } from "@/lib/supabase/queries/articles";

export type ArticleCardView = {
  confidence: number;
  framing: Framing;
  framingLabel: string;
  id: string;
  image: string;
  published: string;
  sentimentLabel: string;
  source: string;
  title: string;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatArticleDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date);
}

export function formatLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatScore(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}`;
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function estimateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 225))} min`;
}

export function articleParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const blocks = normalized
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (blocks.length > 1 || normalized.length < 900) return blocks;

  const sentences = normalized.match(/[^.!?]+(?:[.!?]+["']?|$)/g) ?? [normalized];
  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 3) {
    paragraphs.push(sentences.slice(index, index + 3).join(" ").trim());
  }
  return paragraphs.filter(Boolean);
}

export function toArticleCardView(article: AnalyzedArticle): ArticleCardView {
  return {
    confidence: article.analysis.confidence,
    framing: {
      center: article.analysis.center_percentage,
      left: article.analysis.left_percentage,
      right: article.analysis.right_percentage,
    },
    framingLabel: formatLabel(article.analysis.bias_label),
    id: article.id,
    image: article.image_url,
    published: formatArticleDate(article.published_at),
    sentimentLabel: formatLabel(article.analysis.sentiment_label),
    source: article.source.name,
    title: article.title,
  };
}
