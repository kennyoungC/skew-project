import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  ArticleAnalysis,
  ArticleAnalysisInsert,
} from "@/lib/supabase/types";
import { databaseError } from "@/lib/supabase/queries/shared";

const ANALYSIS_SELECT =
  "id,article_id,summary,sentiment_score,sentiment_label,bias_score,bias_label,left_percentage,center_percentage,right_percentage,confidence,framing_notes,loaded_terms,disclaimer,model,created_at,updated_at";

export async function getAnalysisByArticleId(
  articleId: string,
): Promise<ArticleAnalysis | null> {
  const { data, error } = await getSupabaseServiceClient()
    .from("article_analyses")
    .select(ANALYSIS_SELECT)
    .eq("article_id", articleId)
    .maybeSingle();

  if (error) throw databaseError("get article analysis", error);
  return data;
}

export async function saveArticleAnalysis(
  input: ArticleAnalysisInsert,
): Promise<ArticleAnalysis> {
  const { data, error } = await getSupabaseServiceClient()
    .from("article_analyses")
    .upsert(input, { onConflict: "article_id" })
    .select(ANALYSIS_SELECT)
    .single();

  if (error) throw databaseError("save article analysis", error);
  return data;
}

