import "server-only";

import { z } from "zod";

const BASE_URL = "https://data.oxylabs.io/v1";
const REQUEST_TIMEOUT_MS = 30_000;
const RESULT_TIMEOUT_MS = 60_000;
const MAX_RESPONSE_LENGTH = 8_000_000;
const DECIMAL_ID = /^\d+$/;

export class OxylabsSchedulerError extends Error {
  constructor(
    message: string,
    readonly kind:
      | "configuration"
      | "authentication"
      | "quota"
      | "request"
      | "provider"
      | "timeout"
      | "response",
    readonly status?: number,
  ) {
    super(message);
    this.name = "OxylabsSchedulerError";
  }
}

export type OxylabsSchedulePayload = {
  cron: string;
  end_time: string;
  items: Array<{ source: "universal"; url: string }>;
};

export type OxylabsScheduleRun = {
  jobs: Array<{
    createdAt: string;
    id: string;
    resultCreatedAt: string | null;
    resultStatus: "pending" | "done" | "faulted";
  }>;
  runId: string;
  successRate: number;
};

const rawRunSchema = z.object({
  jobs: z.array(
    z.object({
      created_at: z.string(),
      id: z.string().regex(DECIMAL_ID),
      result_created_at: z.string().nullable().optional(),
      result_status: z.enum(["pending", "done", "faulted"]),
    }),
  ),
  run_id: z.string().regex(DECIMAL_ID),
  success_rate: z.number().min(0).max(1),
});

function credentials(): string {
  const username = process.env.OXY_WSA_USERNAME;
  const password = process.env.OXY_WSA_PASSWORD;
  if (!username || !password) {
    throw new OxylabsSchedulerError(
      "Oxylabs Scheduler is not configured.",
      "configuration",
    );
  }
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function endpoint(path: string): string {
  return `${BASE_URL}${path}`;
}

function assertId(id: string): string {
  if (!DECIMAL_ID.test(id)) {
    throw new OxylabsSchedulerError(
      "Invalid Oxylabs identifier.",
      "request",
    );
  }
  return id;
}

async function request(
  path: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint(path), {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: credentials(),
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      signal: controller.signal,
    });
    const raw = await response.text();
    if (!response.ok) {
      const kind =
        response.status === 401 || response.status === 403
          ? "authentication"
          : response.status === 429
            ? "quota"
            : response.status >= 500
              ? "provider"
              : "request";
      throw new OxylabsSchedulerError(
        `Oxylabs Scheduler request failed with status ${response.status}.`,
        kind,
        response.status,
      );
    }
    if (raw.length > MAX_RESPONSE_LENGTH) {
      throw new OxylabsSchedulerError(
        "Oxylabs response exceeded the configured size limit.",
        "response",
      );
    }
    return raw;
  } catch (error) {
    if (error instanceof OxylabsSchedulerError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new OxylabsSchedulerError(
        "Oxylabs Scheduler request timed out.",
        "timeout",
      );
    }
    throw new OxylabsSchedulerError(
      "Unable to complete the Oxylabs Scheduler request.",
      "provider",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function extractFieldId(raw: string, field: string): string {
  const match = raw.match(
    new RegExp(`"${field}"\\s*:\\s*(?:"(\\d+)"|(\\d+))`),
  );
  const id = match?.[1] ?? match?.[2];
  if (!id) {
    throw new OxylabsSchedulerError(
      `Oxylabs response omitted ${field}.`,
      "response",
    );
  }
  return id;
}

function quoteIdFields(raw: string): string {
  return raw.replace(
    /"(run_id|id)"\s*:\s*(\d+)/g,
    (_match, field: string, id: string) => `"${field}":"${id}"`,
  );
}

export async function createOxylabsSchedule(
  payload: OxylabsSchedulePayload,
): Promise<string> {
  const raw = await request("/schedules", {
    body: JSON.stringify(payload),
    method: "POST",
  });
  return extractFieldId(raw, "schedule_id");
}

export async function listExternalOxylabsScheduleIds(): Promise<string[]> {
  const raw = await request("/schedules");
  const schedules = raw.match(/"schedules"\s*:\s*\[([\s\S]*?)\]/)?.[1];
  if (schedules === undefined) {
    throw new OxylabsSchedulerError(
      "Oxylabs returned an invalid schedule list.",
      "response",
    );
  }
  return [...schedules.matchAll(/\d+/g)].map((match) => match[0]);
}

export async function getExternalOxylabsSchedule(
  scheduleId: string,
): Promise<{ active: boolean; scheduleId: string }> {
  const raw = await request(`/schedules/${assertId(scheduleId)}`);
  const active = raw.match(/"active"\s*:\s*(true|false)/)?.[1];
  if (!active) {
    throw new OxylabsSchedulerError(
      "Oxylabs returned invalid schedule details.",
      "response",
    );
  }
  return {
    active: active === "true",
    scheduleId: extractFieldId(raw, "schedule_id"),
  };
}

export async function listOxylabsScheduleRuns(
  scheduleId: string,
): Promise<OxylabsScheduleRun[]> {
  const raw = await request(`/schedules/${assertId(scheduleId)}/runs`);
  let value: unknown;
  try {
    value = JSON.parse(quoteIdFields(raw));
  } catch {
    throw new OxylabsSchedulerError(
      "Oxylabs returned invalid schedule runs.",
      "response",
    );
  }
  const parsed = z.object({ runs: z.array(rawRunSchema) }).safeParse(value);
  if (!parsed.success) {
    throw new OxylabsSchedulerError(
      "Oxylabs returned an unexpected schedule-runs shape.",
      "response",
    );
  }
  return parsed.data.runs.map((run) => ({
    jobs: run.jobs.map((job) => ({
      createdAt: job.created_at,
      id: job.id,
      resultCreatedAt: job.result_created_at ?? null,
      resultStatus: job.result_status,
    })),
    runId: run.run_id,
    successRate: run.success_rate,
  }));
}

export async function setOxylabsScheduleActive(
  scheduleId: string,
  active: boolean,
): Promise<void> {
  await request(`/schedules/${assertId(scheduleId)}/state`, {
    body: JSON.stringify({ active }),
    method: "PUT",
  });
}

function usableHtml(html: string): boolean {
  const normalized = html.trim().toLowerCase();
  return (
    normalized.length >= 500 &&
    (normalized.includes("<html") ||
      normalized.includes("<body") ||
      normalized.includes("<article"))
  );
}

export async function getOxylabsJobResultHtml(jobId: string): Promise<string> {
  const raw = await request(
    `/queries/${assertId(jobId)}/results`,
    {},
    RESULT_TIMEOUT_MS,
  );
  if (usableHtml(raw)) return raw;

  try {
    const parsed = z
      .object({
        results: z
          .array(z.object({ content: z.string() }))
          .min(1),
      })
      .parse(JSON.parse(raw));
    const html = parsed.results[0].content;
    if (usableHtml(html)) return html;
  } catch {
    // Convert all malformed result variants into one safe provider error.
  }
  throw new OxylabsSchedulerError(
    "Oxylabs job result did not contain usable HTML.",
    "response",
  );
}
