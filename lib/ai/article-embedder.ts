import "server-only";

import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

import type { Article } from "@/lib/supabase/types";

export const ARTICLE_EMBEDDING_MODEL = "text-embedding-3-small";
export const ARTICLE_EMBEDDING_DIMENSIONS = 1_536;

const MAX_EMBEDDING_CHARACTERS = 24_000;
const EMBEDDING_TIMEOUT_MS = 120_000;

function embeddingInput(article: Article): string {
  const prefix = `Title: ${article.title}\n\nArticle:\n`;
  const available = Math.max(1, MAX_EMBEDDING_CHARACTERS - prefix.length);
  return `${prefix}${article.raw_text.trim().slice(0, available)}`;
}

export async function generateArticleEmbedding(
  article: Article,
): Promise<number[]> {
  const { embedding } = await embed({
    abortSignal: AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
    maxRetries: 2,
    model: openai.embedding(ARTICLE_EMBEDDING_MODEL),
    value: embeddingInput(article),
  });

  if (
    embedding.length !== ARTICLE_EMBEDDING_DIMENSIONS ||
    embedding.some((value) => !Number.isFinite(value))
  ) {
    throw new Error("invalid_embedding");
  }

  return embedding;
}
