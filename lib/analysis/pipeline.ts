import "server-only";

import {
  ANALYSIS_DISCLAIMER,
  ARTICLE_ANALYSIS_MODEL,
  ArticleAnalysisGenerationError,
  analyzeArticleWithAI,
} from "@/lib/ai/article-analyzer";
import { generateArticleEmbedding } from "@/lib/ai/article-embedder";
import type {
  AnalysisFailure,
  AnalysisPipelineInput,
  AnalysisSummary,
} from "@/lib/analysis/types";
import {
  countPendingAnalysisArticles,
  listPendingAnalysisArticles,
  markArticleAnalyzed,
} from "@/lib/supabase/queries/articles";
import {
  saveAnalysisEmbedding,
  saveArticleAnalysis,
} from "@/lib/supabase/queries/analyses";
import { createLog } from "@/lib/supabase/queries/logs";

const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 25;
const MIN_ARTICLE_CHARACTERS = 200;

function configuredBatchSize(): number {
  const parsed = Number.parseInt(process.env.ANALYSIS_BATCH_SIZE ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_BATCH_SIZE;
  return Math.min(parsed, MAX_BATCH_SIZE);
}

function safeTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim().slice(0, 80);
}

async function logAnalysis(
  level: "info" | "warn" | "error",
  event: string,
  message: string,
  context: Record<string, boolean | number | string | null> = {},
  articleId?: string,
): Promise<void> {
  console[level === "warn" ? "warn" : level](`[analysis] ${message}`, context);
  try {
    await createLog({ article_id: articleId ?? null, context, event, level, message });
  } catch {
    console.warn("[analysis] Database log write failed.", { event });
  }
}

export async function runArticleAnalysisPipeline(
  input: AnalysisPipelineInput = {},
): Promise<AnalysisSummary> {
  const startedAt = Date.now();
  const batchSize = configuredBatchSize();
  const pendingFound = await countPendingAnalysisArticles(input.articleIds);
  const attemptedIds = new Set<string>();
  const failures: AnalysisFailure[] = [];
  const totalLimit = input.limit ?? Number.POSITIVE_INFINITY;
  let analyzed = 0;
  let embeddingsGenerated = 0;
  let embeddingsBackfilled = 0;
  let skipped = 0;
  let failed = 0;
  let batchesProcessed = 0;

  await logAnalysis("info", "analysis.started", "AI analysis started.", {
    batchSize,
    pendingFound,
    requestedLimit: input.limit ?? null,
    selectedArticleCount: input.articleIds?.length ?? null,
  });

  while (attemptedIds.size < totalLimit) {
    const remainingCapacity = totalLimit - attemptedIds.size;
    const articles = await listPendingAnalysisArticles({
      articleIds: input.articleIds,
      excludeIds: attemptedIds,
      limit: Math.min(batchSize, remainingCapacity),
    });
    if (articles.length === 0) break;

    batchesProcessed += 1;
    let batchAnalyzed = 0;
    let batchEmbeddings = 0;
    let batchBackfilled = 0;
    let batchSkipped = 0;
    let batchFailed = 0;

    for (const article of articles) {
      attemptedIds.add(article.id);

      if (article.raw_text.trim().length < MIN_ARTICLE_CHARACTERS) {
        skipped += 1;
        batchSkipped += 1;
        failures.push({ articleId: article.id, reason: "article_text_too_short" });
        await logAnalysis(
          "warn",
          "analysis.skipped",
          "Article skipped because its stored text is too short.",
          { title: safeTitle(article.title) },
          article.id,
        );
        continue;
      }

      try {
        if (article.existingAnalysis) {
          const embedding = await generateArticleEmbedding(article);
          await saveAnalysisEmbedding(article.id, embedding);
          await markArticleAnalyzed(article.id);
          embeddingsGenerated += 1;
          embeddingsBackfilled += 1;
          batchEmbeddings += 1;
          batchBackfilled += 1;
          continue;
        }

        const [output, embedding] = await Promise.all([
          analyzeArticleWithAI(article),
          generateArticleEmbedding(article),
        ]);
        const biasScore = Number(
          ((output.rightPercentage - output.leftPercentage) / 100).toFixed(4),
        );

        await saveArticleAnalysis({
          article_id: article.id,
          bias_label: output.politicalFramingLabel,
          bias_score: biasScore,
          center_percentage: output.centerPercentage,
          confidence: output.confidence,
          disclaimer: ANALYSIS_DISCLAIMER,
          embedding,
          framing_notes: output.framingNotes,
          left_percentage: output.leftPercentage,
          loaded_terms: output.loadedTerms,
          model: ARTICLE_ANALYSIS_MODEL,
          right_percentage: output.rightPercentage,
          sentiment_label: output.sentimentLabel,
          sentiment_score: output.sentimentScore,
          summary: output.summary,
        });

        analyzed += 1;
        embeddingsGenerated += 1;
        batchAnalyzed += 1;
        batchEmbeddings += 1;

        try {
          await markArticleAnalyzed(article.id);
        } catch {
          failed += 1;
          batchFailed += 1;
          failures.push({
            articleId: article.id,
            reason: "analysis_saved_but_timestamp_update_failed",
          });
          await logAnalysis(
            "error",
            "analysis.timestamp_failed",
            "Analysis was saved, but analyzed_at could not be updated.",
            { title: safeTitle(article.title) },
            article.id,
          );
        }
      } catch (error) {
        failed += 1;
        batchFailed += 1;
        const reason =
          error instanceof ArticleAnalysisGenerationError
            ? error.category
            : "analysis_persistence_failed";
        failures.push({ articleId: article.id, reason });
        await logAnalysis(
          "error",
          "analysis.failed",
          "Article analysis failed.",
          { reason, title: safeTitle(article.title) },
          article.id,
        );
      }
    }

    await logAnalysis("info", "analysis.batch_completed", "Analysis batch completed.", {
      analyzed: batchAnalyzed,
      batch: batchesProcessed,
      embeddingsBackfilled: batchBackfilled,
      embeddingsGenerated: batchEmbeddings,
      failed: batchFailed,
      skipped: batchSkipped,
    });
  }

  const remaining = await countPendingAnalysisArticles(input.articleIds);
  const status =
    analyzed === 0 && embeddingsBackfilled === 0 && failed > 0
      ? "failed"
      : failed > 0 || skipped > 0 || remaining > 0
        ? "partial"
        : "completed";
  const summary: AnalysisSummary = {
    analyzed,
    batchesProcessed,
    durationMs: Date.now() - startedAt,
    embeddingsBackfilled,
    embeddingsGenerated,
    failed,
    failures,
    pendingFound,
    remaining,
    skipped,
    status,
  };

  await logAnalysis(
    status === "failed" ? "error" : status === "partial" ? "warn" : "info",
    "analysis.completed",
    "AI analysis completed.",
    {
      analyzed,
      batchesProcessed,
      durationMs: summary.durationMs,
      embeddingsBackfilled,
      embeddingsGenerated,
      failed,
      pendingFound,
      remaining,
      skipped,
      status,
    },
  );

  return summary;
}
