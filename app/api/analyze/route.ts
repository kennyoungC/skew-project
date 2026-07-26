import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOpenAIConfiguration } from "@/lib/ai/article-analyzer";
import { runArticleAnalysisPipeline } from "@/lib/analysis/pipeline";
import {
  hasValidAdminSecret,
  requireAdminSecretConfiguration,
} from "@/lib/auth/admin-secret";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BODY_BYTES = 10_000;
const MAX_SELECTED_ARTICLES = 100;

const requestSchema = z
  .object({
    articleIds: z.array(z.uuid()).min(1).max(MAX_SELECTED_ARTICLES).optional(),
    limit: z.int().min(1).max(MAX_SELECTED_ARTICLES).optional(),
  })
  .strict()
  .transform((value) => ({
    ...value,
    articleIds: value.articleIds ? [...new Set(value.articleIds)] : undefined,
  }));

async function readBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    throw new Error("request_body_too_large");
  }
  if (!text.trim()) return {};
  return JSON.parse(text) as unknown;
}

export async function POST(request: Request) {
  try {
    requireAdminSecretConfiguration();
  } catch {
    return NextResponse.json(
      { error: "Analysis authorization is not configured." },
      { status: 500 },
    );
  }

  if (!hasValidAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    requireOpenAIConfiguration();
  } catch {
    return NextResponse.json(
      { error: "AI analysis is not configured." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "request_body_too_large"
        ? "Request body is too large."
        : "Request body must be valid JSON.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid analysis request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const summary = await runArticleAnalysisPipeline(parsed.data);

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: "system",
      event: "analysis_run_completed",
      properties: {
        analyzed: summary.analyzed,
        duration_ms: summary.durationMs,
        failed: summary.failed,
        pending_found: summary.pendingFound,
        skipped: summary.skipped,
        status: summary.status,
      },
    });
    await posthog.flush();

    return NextResponse.json(summary, {
      status: summary.status === "failed" ? 502 : 200,
    });
  } catch {
    console.error("[analysis] Pipeline failed before completion.");
    return NextResponse.json(
      { error: "AI analysis pipeline failed." },
      { status: 500 },
    );
  }
}
