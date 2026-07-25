import "server-only";

import { timingSafeEqual } from "node:crypto";

export function hasValidAdminSecret(request: Request): boolean {
  const expected = process.env.BIASLY_ADMIN_SECRET;
  const received = request.headers.get("x-biasly-admin-secret");

  if (!expected || !received) return false;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function requireAdminSecretConfiguration(): void {
  if (!process.env.BIASLY_ADMIN_SECRET) {
    throw new Error("Missing BIASLY_ADMIN_SECRET server configuration.");
  }
}

