import {
  hasValidAdminSecret,
  requireAdminSecretConfiguration,
} from "@/lib/auth/admin-secret";
import { syncOxylabsSchedules } from "@/lib/oxylabs/scheduler-service";
import { listOxylabsSchedules } from "@/lib/supabase/queries/oxylabs-schedules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  try {
    return Response.json({ schedules: await listOxylabsSchedules() });
  } catch {
    return Response.json(
      { error: "Unable to list Oxylabs schedules." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    requireAdminSecretConfiguration();
  } catch {
    return Response.json(
      { error: "Schedule authorization is not configured." },
      { status: 500 },
    );
  }
  if (!hasValidAdminSecret(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 1_000) {
    return Response.json({ error: "Request body is too large." }, { status: 400 });
  }
  if (rawBody.trim()) {
    try {
      const body = JSON.parse(rawBody) as unknown;
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).length > 0
      ) {
        return Response.json(
          { error: "Request body must be an empty JSON object." },
          { status: 400 },
        );
      }
    } catch {
      return Response.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }
  }

  try {
    const summary = await syncOxylabsSchedules();
    return Response.json(summary, {
      status: summary.status === "failed" ? 502 : 200,
    });
  } catch {
    console.error("[scheduler] Schedule sync failed before completion.");
    return Response.json(
      { error: "Oxylabs schedule sync failed." },
      { status: 500 },
    );
  }
}
