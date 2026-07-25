import "server-only";

export const MAX_PAGE_SIZE = 100;
export const URL_FILTER_CHUNK_SIZE = 15;

export function boundedLimit(limit: number | undefined, fallback: number): number {
  if (limit === undefined || !Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(limit)));
}

export function boundedOffset(offset: number | undefined): number {
  if (offset === undefined || !Number.isFinite(offset)) return 0;
  return Math.max(0, Math.floor(offset));
}

export function databaseError(operation: string, error: unknown): Error {
  const detail =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "Unknown database error";

  return new Error(`Supabase ${operation} failed: ${detail}`, { cause: error });
}

export function chunksOf<T>(values: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

