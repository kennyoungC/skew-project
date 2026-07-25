import { z } from "zod";

import {
  hasValidAdminSecret,
  requireAdminSecretConfiguration,
} from "@/lib/auth/admin-secret";
import {
  runManualScrapePipeline,
  ScrapeSelectionError,
} from "@/lib/scraping/pipeline";
import {
  DEFAULT_LIMIT_PER_SOURCE,
  MAX_LIMIT_PER_SOURCE,
} from "@/lib/scraping/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_REQUEST_BODY_LENGTH = 10_000;

const scrapeRequestSchema = z
  .object({
    limitPerSource: z
      .number()
      .int()
      .min(1)
      .max(MAX_LIMIT_PER_SOURCE)
      .default(DEFAULT_LIMIT_PER_SOURCE),
    sourceIds: z.array(z.uuid()).max(25).optional(),
    sourceNames: z.array(z.string().trim().min(1).max(100)).max(25).optional(),
  })
  .strict()
  .transform((value) => ({
    ...value,
    sourceIds: value.sourceIds
      ? [...new Set(value.sourceIds)]
      : undefined,
    sourceNames: value.sourceNames
      ? [...new Set(value.sourceNames)]
      : undefined,
  }));

async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text.trim()) return {};
  if (text.length > MAX_REQUEST_BODY_LENGTH) {
    throw new SyntaxError("Request body is too large.");
  }
  return JSON.parse(text);
}

export async function POST(request: Request) {
  try {
    requireAdminSecretConfiguration();
  } catch {
    return Response.json(
      { error: "Scraping is not configured on this server." },
      { status: 500 },
    );
  }

  if (!hasValidAdminSecret(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const parsed = scrapeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid scrape request.",
        issues: parsed.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const summary = await runManualScrapePipeline(parsed.data);
    return Response.json(summary, {
      status: summary.status === "failed" ? 502 : 200,
    });
  } catch (error) {
    if (error instanceof ScrapeSelectionError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("[scrape] Pipeline failed before completion.");
    return Response.json(
      { error: "Scrape pipeline failed." },
      { status: 500 },
    );
  }
}

