export type AnalysisPipelineInput = {
  articleIds?: readonly string[];
  limit?: number;
};

export type AnalysisFailure = {
  articleId: string;
  reason: string;
};

export type AnalysisSummary = {
  status: "completed" | "partial" | "failed";
  batchesProcessed: number;
  pendingFound: number;
  analyzed: number;
  skipped: number;
  failed: number;
  remaining: number;
  durationMs: number;
  failures: AnalysisFailure[];
};

