import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  OxylabsSchedule,
  OxylabsScheduleInsert,
  OxylabsScheduleUpdate,
  Source,
} from "@/lib/supabase/types";
import { databaseError } from "@/lib/supabase/queries/shared";

const SCHEDULE_SELECT =
  "id,source_id,schedule_id,status,cron_expression,request_payload,last_synced_at,created_at,updated_at";

export type OxylabsScheduleWithSource = OxylabsSchedule & {
  source: Pick<Source, "id" | "name" | "listing_url" | "is_active">;
};

export async function listOxylabsSchedules(): Promise<
  OxylabsScheduleWithSource[]
> {
  const { data, error } = await getSupabaseServiceClient()
    .from("oxylabs_schedules")
    .select(
      `${SCHEDULE_SELECT},source:sources(id,name,listing_url,is_active)`,
    )
    .order("created_at", { ascending: false });

  if (error) throw databaseError("list Oxylabs schedules", error);
  return data as unknown as OxylabsScheduleWithSource[];
}

export async function getOxylabsScheduleBySourceId(
  sourceId: string,
): Promise<OxylabsSchedule | null> {
  const { data, error } = await getSupabaseServiceClient()
    .from("oxylabs_schedules")
    .select(SCHEDULE_SELECT)
    .eq("source_id", sourceId)
    .maybeSingle();

  if (error) throw databaseError("get Oxylabs schedule by source", error);
  return data;
}

export async function getOxylabsScheduleByExternalId(
  scheduleId: string,
): Promise<OxylabsSchedule | null> {
  const { data, error } = await getSupabaseServiceClient()
    .from("oxylabs_schedules")
    .select(SCHEDULE_SELECT)
    .eq("schedule_id", scheduleId)
    .maybeSingle();

  if (error) throw databaseError("get Oxylabs schedule by external ID", error);
  return data;
}

export async function saveOxylabsSchedule(
  input: OxylabsScheduleInsert,
): Promise<OxylabsSchedule> {
  const { data, error } = await getSupabaseServiceClient()
    .from("oxylabs_schedules")
    .upsert(input, { onConflict: "source_id" })
    .select(SCHEDULE_SELECT)
    .single();

  if (error) throw databaseError("save Oxylabs schedule", error);
  return data;
}

export async function updateOxylabsSchedule(
  id: string,
  input: OxylabsScheduleUpdate,
): Promise<OxylabsSchedule> {
  const { data, error } = await getSupabaseServiceClient()
    .from("oxylabs_schedules")
    .update(input)
    .eq("id", id)
    .select(SCHEDULE_SELECT)
    .single();

  if (error) throw databaseError("update Oxylabs schedule", error);
  return data;
}

export async function listStoredOxylabsScheduleIds(): Promise<string[]> {
  const { data, error } = await getSupabaseServiceClient()
    .from("oxylabs_schedules")
    .select("schedule_id")
    .eq("status", "active");

  if (error) throw databaseError("list stored Oxylabs schedule IDs", error);
  return data.map((row) => row.schedule_id);
}
