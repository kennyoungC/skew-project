import "server-only";

import type { SourceStrategy } from "@/lib/scraping/types";

const TRACKING_PARAMETERS = [
  "fbclid",
  "gclid",
  "guccounter",
  "guce_referrer",
  "guce_referrer_sig",
  "mc_cid",
  "mc_eid",
] as const;

function isIpAddress(hostname: string): boolean {
  return (
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) ||
    hostname.includes(":")
  );
}

function isAllowedHost(hostname: string, allowedHosts: readonly string[]) {
  const normalized = hostname.toLowerCase();
  return allowedHosts.some((allowed) => normalized === allowed.toLowerCase());
}

export function normalizeCandidateUrl(
  href: string,
  baseUrl: string,
  strategy: SourceStrategy,
): URL | null {
  try {
    const url = new URL(href, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const hostname = url.hostname.toLowerCase();
    if (
      !hostname ||
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      isIpAddress(hostname) ||
      !isAllowedHost(hostname, strategy.allowedHosts)
    ) {
      return null;
    }

    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (
        key.toLowerCase().startsWith("utm_") ||
        TRACKING_PARAMETERS.includes(
          key.toLowerCase() as (typeof TRACKING_PARAMETERS)[number],
        )
      ) {
        url.searchParams.delete(key);
      }
    }

    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }

    return url;
  } catch {
    return null;
  }
}

export function normalizeArticleAssetUrl(
  value: string | undefined,
  baseUrl: string,
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (
      !url.hostname ||
      url.hostname === "localhost" ||
      url.hostname.endsWith(".local") ||
      isIpAddress(url.hostname)
    ) {
      return null;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

