import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  OxylabsScheduleRun,
  OxylabsScheduleRunInsert,
  OxylabsScheduleRunUpdate,
} from "@/lib/supabase/types";
import {
  boundedLimit,
  boundedOffset,
  chunksOf,
  databaseError,
  URL_FILTER_CHUNK_SIZE,
} from "@/lib/supabase/queries/shared";

const RUN_SELECT =
  "id,oxylabs_schedule_id,external_run_id,external_job_id,status,result_status,summary,error,started_at,processed_at,created_at,updated_at";

export type ExistingOxylabsRunIdentifiers = {
  jobIds: Set<string>;
  runIds: Set<string>;
};

export async function findExistingOxylabsRunIdentifiers(
  scheduleId: string,
  identifiers: {
    jobIds?: readonly string[];
    runIds?: readonly string[];
  },
): Promise<ExistingOxylabsRunIdentifiers> {
  const client = getSupabaseServiceClient();
  const jobIds = new Set<string>();
  const runIds = new Set<string>();

  for (const chunk of chunksOf(
    [...new Set(identifiers.jobIds ?? [])],
    URL_FILTER_CHUNK_SIZE,
  )) {
    const { data, error } = await client
      .from("oxylabs_schedule_runs")
      .select("external_job_id")
      .eq("oxylabs_schedule_id", scheduleId)
      .in("external_job_id", chunk);

    if (error) throw databaseError("check Oxylabs job IDs", error);
    for (const row of data) {
      if (row.external_job_id) jobIds.add(row.external_job_id);
    }
  }

  for (const chunk of chunksOf(
    [...new Set(identifiers.runIds ?? [])],
    URL_FILTER_CHUNK_SIZE,
  )) {
    const { data, error } = await client
      .from("oxylabs_schedule_runs")
      .select("external_run_id")
      .eq("oxylabs_schedule_id", scheduleId)
      .in("external_run_id", chunk);

    if (error) throw databaseError("check Oxylabs run IDs", error);
    for (const row of data) {
      if (row.external_run_id) runIds.add(row.external_run_id);
    }
  }

  return { jobIds, runIds };
}

export async function createOxylabsScheduleRun(
  input: OxylabsScheduleRunInsert,
): Promise<OxylabsScheduleRun> {
  const { data, error } = await getSupabaseServiceClient()
    .from("oxylabs_schedule_runs")
    .insert(input)
    .select(RUN_SELECT)
    .single();

  if (error) throw databaseError("create Oxylabs schedule run", error);
  return data;
}

export async function getOxylabsScheduleRunByJobId(
  scheduleId: string,
  jobId: string,
): Promise<OxylabsScheduleRun | null> {
  const { data, error } = await getSupabaseServiceClient()
    .from("oxylabs_schedule_runs")
    .select(RUN_SELECT)
    .eq("oxylabs_schedule_id", scheduleId)
    .eq("external_job_id", jobId)
    .maybeSingle();

  if (error) throw databaseError("get Oxylabs run by job ID", error);
  return data;
}

export async function updateOxylabsScheduleRun(
  id: string,
  input: OxylabsScheduleRunUpdate,
): Promise<OxylabsScheduleRun> {
  const { data, error } = await getSupabaseServiceClient()
    .from("oxylabs_schedule_runs")
    .update(input)
    .eq("id", id)
    .select(RUN_SELECT)
    .single();

  if (error) throw databaseError("update Oxylabs schedule run", error);
  return data;
}

export async function listRecentOxylabsScheduleRuns(options: {
  limit?: number;
  offset?: number;
  scheduleId?: string;
  status?: OxylabsScheduleRun["status"];
} = {}): Promise<OxylabsScheduleRun[]> {
  const limit = boundedLimit(options.limit, 50);
  const offset = boundedOffset(options.offset);
  let query = getSupabaseServiceClient()
    .from("oxylabs_schedule_runs")
    .select(RUN_SELECT)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.scheduleId) {
    query = query.eq("oxylabs_schedule_id", options.scheduleId);
  }
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) throw databaseError("list Oxylabs schedule runs", error);
  return data;
}
