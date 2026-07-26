import { runArticleAnalysisPipeline } from "@/lib/analysis/pipeline";
import { hasValidCronSecret } from "@/lib/auth/cron-secret";
import { processScheduledResults } from "@/lib/oxylabs/scheduler-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type StepResult =
  | { ok: true; summary: unknown }
  | { error: string; ok: false };

export async function GET(request: Request) {
  if (!hasValidCronSecret(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let processing: StepResult;
  try {
    processing = { ok: true, summary: await processScheduledResults() };
  } catch {
    console.error("[cron] Scheduled result processing failed.");
    processing = { error: "Scheduled result processing failed.", ok: false };
  }

  let analysis: StepResult;
  try {
    analysis = {
      ok: true,
      summary: await runArticleAnalysisPipeline({}),
    };
  } catch {
    console.error("[cron] AI analysis failed.");
    analysis = { error: "AI analysis failed.", ok: false };
  }

  const status =
    processing.ok && analysis.ok
      ? "completed"
      : processing.ok || analysis.ok
        ? "partial"
        : "failed";
  return Response.json(
    { analysis, processing, status },
    { status: status === "failed" ? 502 : 200 },
  );
}
