import { z } from "zod";

import { listRecentOxylabsScheduleRuns } from "@/lib/supabase/queries/oxylabs-schedule-runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  scheduleId: z.uuid().optional(),
  status: z
    .enum(["discovered", "processing", "completed", "failed", "skipped"])
    .optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
    scheduleId: url.searchParams.get("scheduleId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid runs query.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const runs = await listRecentOxylabsScheduleRuns(parsed.data);
    return Response.json({ runs });
  } catch {
    return Response.json(
      { error: "Unable to list Oxylabs schedule runs." },
      { status: 500 },
    );
  }
}
