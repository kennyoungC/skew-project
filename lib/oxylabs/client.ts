import "server-only";

import { z } from "zod";

const OXYLABS_REALTIME_URL = "https://realtime.oxylabs.io/v1/queries";
const REQUEST_TIMEOUT_MS = 175_000;
const MAX_HTML_LENGTH = 8_000_000;
const MIN_USABLE_HTML_LENGTH = 500;

const resultSchema = z.object({
  content: z.string(),
  status_code: z.number().int().optional(),
  url: z.string().optional(),
});

const responseSchema = z.object({
  results: z.array(resultSchema).min(1),
});

export type OxylabsFailureKind =
  | "configuration"
  | "authentication"
  | "quota"
  | "request"
  | "provider"
  | "timeout"
  | "response";

export class OxylabsError extends Error {
  constructor(
    message: string,
    readonly kind: OxylabsFailureKind,
    readonly status?: number,
  ) {
    super(message);
    this.name = "OxylabsError";
  }
}

function requireCredential(name: "OXY_WSA_USERNAME" | "OXY_WSA_PASSWORD") {
  const value = process.env[name];
  if (!value) {
    throw new OxylabsError(
      `Missing ${name} server configuration.`,
      "configuration",
    );
  }
  return value;
}

function isUsableHtml(html: string): boolean {
  const normalized = html.trim().toLowerCase();
  return (
    normalized.length >= MIN_USABLE_HTML_LENGTH &&
    (normalized.includes("<html") ||
      normalized.includes("<article") ||
      normalized.includes("<body"))
  );
}

async function requestHtml(url: string, render: boolean): Promise<string> {
  const username = requireCredential("OXY_WSA_USERNAME");
  const password = requireCredential("OXY_WSA_PASSWORD");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OXYLABS_REALTIME_URL, {
      body: JSON.stringify({
        source: "universal",
        url,
        user_agent_type: "desktop_chrome",
        ...(render ? { render: "html" } : {}),
      }),
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      const kind: OxylabsFailureKind =
        response.status === 401 || response.status === 403
          ? "authentication"
          : response.status === 429
            ? "quota"
            : response.status >= 400 && response.status < 500
              ? "request"
              : "provider";
      throw new OxylabsError(
        `Oxylabs request failed with status ${response.status}.`,
        kind,
        response.status,
      );
    }

    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new OxylabsError(
        "Oxylabs returned an unexpected response shape.",
        "response",
      );
    }

    const result = parsed.data.results[0];
    if (
      result.status_code !== undefined &&
      (result.status_code < 200 || result.status_code >= 400)
    ) {
      throw new OxylabsError(
        `Oxylabs target request returned status ${result.status_code}.`,
        "provider",
        result.status_code,
      );
    }

    if (result.content.length > MAX_HTML_LENGTH) {
      throw new OxylabsError(
        "Oxylabs HTML result exceeded the configured size limit.",
        "response",
      );
    }

    return result.content;
  } catch (error) {
    if (error instanceof OxylabsError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new OxylabsError("Oxylabs request timed out.", "timeout");
    }
    throw new OxylabsError("Unable to complete the Oxylabs request.", "provider");
  } finally {
    clearTimeout(timeout);
  }
}

export async function scrapeHtmlWithOxylabs(url: string): Promise<string> {
  const html = await requestHtml(url, false);
  if (isUsableHtml(html)) return html;

  const renderedHtml = await requestHtml(url, true);
  if (!isUsableHtml(renderedHtml)) {
    throw new OxylabsError(
      "Oxylabs returned unusable HTML after rendering.",
      "response",
    );
  }

  return renderedHtml;
}

