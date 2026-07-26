import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  Article,
  ArticleAnalysis,
  ArticleInsert,
  Source,
  Vector,
} from "@/lib/supabase/types";
import {
  boundedLimit,
  boundedOffset,
  chunksOf,
  databaseError,
  URL_FILTER_CHUNK_SIZE,
} from "@/lib/supabase/queries/shared";

const ARTICLE_VIEW_SELECT = `
  id,source_id,original_url,canonical_url,title,image_url,published_at,
  raw_text,scraped_at,analyzed_at,created_at,updated_at,
  source:sources(id,name,listing_url,logo_url),
  analysis:article_analyses!inner(
    id,article_id,summary,sentiment_score,sentiment_label,bias_score,bias_label,
    left_percentage,center_percentage,right_percentage,confidence,framing_notes,
    loaded_terms,disclaimer,model,created_at,updated_at
  )
`;
const EMBEDDED_ARTICLE_VIEW_SELECT = ARTICLE_VIEW_SELECT.replace(
  "loaded_terms,disclaimer,model,created_at,updated_at",
  "loaded_terms,disclaimer,model,embedding,created_at,updated_at",
);

export type AnalyzedArticle = Article & {
  source: Pick<Source, "id" | "name" | "listing_url" | "logo_url">;
  analysis: Omit<ArticleAnalysis, "embedding"> & {
    embedding?: Vector | null;
  };
};

export type AnalysisWorkItem = Article & {
  existingAnalysis: Pick<ArticleAnalysis, "embedding" | "id"> | null;
};

export type RelatedArticle = {
  biasLabel: ArticleAnalysis["bias_label"];
  centerPercentage: number;
  confidence: number;
  id: string;
  imageUrl: string;
  leftPercentage: number;
  publishedAt: string;
  rightPercentage: number;
  sentimentLabel: ArticleAnalysis["sentiment_label"];
  similarity: number;
  sourceName: string;
  title: string;
};

export type ArticleUrlExistence = {
  originalUrls: Set<string>;
  canonicalUrls: Set<string>;
};

export async function listAnalyzedArticles(options: {
  limit?: number;
  offset?: number;
} = {}): Promise<AnalyzedArticle[]> {
  const limit = boundedLimit(options.limit, 24);
  const offset = boundedOffset(options.offset);
  const { data, error } = await getSupabaseServiceClient()
    .from("articles")
    .select(ARTICLE_VIEW_SELECT)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw databaseError("list analyzed articles", error);
  return data as unknown as AnalyzedArticle[];
}

export async function getAnalyzedArticleById(
  id: string,
): Promise<AnalyzedArticle | null> {
  const { data, error } = await getSupabaseServiceClient()
    .from("articles")
    .select(EMBEDDED_ARTICLE_VIEW_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw databaseError("get analyzed article", error);
  return data as unknown as AnalyzedArticle | null;
}

export async function findExistingArticleUrls(
  urls: readonly string[],
): Promise<ArticleUrlExistence> {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  const originalUrls = new Set<string>();
  const canonicalUrls = new Set<string>();
  const client = getSupabaseServiceClient();

  for (const chunk of chunksOf(uniqueUrls, URL_FILTER_CHUNK_SIZE)) {
    const [originalResult, canonicalResult] = await Promise.all([
      client
        .from("articles")
        .select("original_url")
        .in("original_url", chunk),
      client
        .from("articles")
        .select("canonical_url")
        .in("canonical_url", chunk),
    ]);

    if (originalResult.error) {
      throw databaseError("check original article URLs", originalResult.error);
    }
    if (canonicalResult.error) {
      throw databaseError("check canonical article URLs", canonicalResult.error);
    }

    for (const row of originalResult.data) originalUrls.add(row.original_url);
    for (const row of canonicalResult.data) {
      if (row.canonical_url) canonicalUrls.add(row.canonical_url);
    }
  }

  return { canonicalUrls, originalUrls };
}

export async function insertArticlesAppendOnly(
  input: ArticleInsert | readonly ArticleInsert[],
): Promise<Article[]> {
  const rows = Array.isArray(input) ? [...input] : [input];
  if (rows.length === 0) return [];

  const { data, error } = await getSupabaseServiceClient()
    .from("articles")
    .upsert(rows, {
      ignoreDuplicates: true,
      onConflict: "original_url",
    })
    .select(
      "id,source_id,original_url,canonical_url,title,image_url,published_at,raw_text,scraped_at,analyzed_at,created_at,updated_at",
    );

  if (error) throw databaseError("insert articles append-only", error);
  return data;
}

export async function markArticleAnalyzed(
  articleId: string,
  analyzedAt = new Date().toISOString(),
): Promise<void> {
  const { error } = await getSupabaseServiceClient()
    .from("articles")
    .update({ analyzed_at: analyzedAt })
    .eq("id", articleId);

  if (error) throw databaseError("mark article analyzed", error);
}

export type PendingAnalysisOptions = {
  articleIds?: readonly string[];
  excludeIds?: ReadonlySet<string>;
  limit?: number;
};

export async function listPendingAnalysisArticles(
  options: PendingAnalysisOptions = {},
): Promise<AnalysisWorkItem[]> {
  const limit = boundedLimit(options.limit, 5);
  const pageSize = 100;
  const pending: AnalysisWorkItem[] = [];
  let offset = 0;

  while (pending.length < limit) {
    let query = getSupabaseServiceClient()
      .from("articles")
      .select(
        `
          id,source_id,original_url,canonical_url,title,image_url,published_at,
          raw_text,scraped_at,analyzed_at,created_at,updated_at,
          article_analyses(id,embedding)
        `,
      )
      .order("created_at", { ascending: true });

    if (options.articleIds) {
      if (options.articleIds.length === 0) return [];
      query = query.in("id", [...options.articleIds]);
    }

    const { data, error } = await query.range(
      offset,
      offset + pageSize - 1,
    );

    if (error) throw databaseError("list pending-analysis articles", error);

    for (const row of data) {
      const existingAnalysis = row.article_analyses;
      if (
        (existingAnalysis === null || existingAnalysis.embedding === null) &&
        !options.excludeIds?.has(row.id)
      ) {
        pending.push({
          analyzed_at: row.analyzed_at,
          canonical_url: row.canonical_url,
          created_at: row.created_at,
          id: row.id,
          image_url: row.image_url,
          original_url: row.original_url,
          published_at: row.published_at,
          raw_text: row.raw_text,
          scraped_at: row.scraped_at,
          source_id: row.source_id,
          title: row.title,
          updated_at: row.updated_at,
          existingAnalysis,
        });
        if (pending.length === limit) break;
      }
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return pending;
}

export async function countPendingAnalysisArticles(
  articleIds?: readonly string[],
): Promise<number> {
  const pageSize = 100;
  let offset = 0;
  let count = 0;

  if (articleIds?.length === 0) return 0;

  while (true) {
    let query = getSupabaseServiceClient()
      .from("articles")
      .select("id,article_analyses(id,embedding)")
      .order("created_at", { ascending: true });

    if (articleIds) query = query.in("id", [...articleIds]);

    const { data, error } = await query.range(
      offset,
      offset + pageSize - 1,
    );
    if (error) throw databaseError("count pending-analysis articles", error);

    count += data.filter(
      (row) =>
        row.article_analyses === null ||
        row.article_analyses.embedding === null,
    ).length;
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return count;
}

function vectorLiteral(embedding: Vector): string {
  if (typeof embedding === "string") return embedding;
  return `[${embedding.join(",")}]`;
}

export async function getRelatedArticles(
  articleId: string,
  embedding: Vector | null | undefined,
  requestedLimit = 5,
): Promise<RelatedArticle[]> {
  if (!embedding) return [];
  const limit = Math.min(Math.max(Math.trunc(requestedLimit), 1), 5);
  const { data, error } = await getSupabaseServiceClient().rpc(
    "match_related_articles",
    {
      match_count: limit,
      query_article_id: articleId,
      query_embedding: vectorLiteral(embedding),
    },
  );

  if (error) throw databaseError("list related articles", error);
  return data.map((row) => ({
    biasLabel: row.bias_label,
    centerPercentage: row.center_percentage,
    confidence: row.confidence,
    id: row.id,
    imageUrl: row.image_url,
    leftPercentage: row.left_percentage,
    publishedAt: row.published_at,
    rightPercentage: row.right_percentage,
    sentimentLabel: row.sentiment_label,
    similarity: row.similarity,
    sourceName: row.source_name,
    title: row.title,
  }));
}
