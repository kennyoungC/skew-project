import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { Log, LogInsert } from "@/lib/supabase/types";
import {
  boundedLimit,
  boundedOffset,
  databaseError,
} from "@/lib/supabase/queries/shared";

const LOG_SELECT =
  "id,level,event,message,source_id,article_id,schedule_id,schedule_run_id,context,created_at";

export async function createLog(input: LogInsert): Promise<Log> {
  const { data, error } = await getSupabaseServiceClient()
    .from("logs")
    .insert(input)
    .select(LOG_SELECT)
    .single();

  if (error) throw databaseError("create log", error);
  return data;
}

export async function listRecentLogs(options: {
  articleId?: string;
  event?: string;
  level?: Log["level"];
  limit?: number;
  offset?: number;
  scheduleId?: string;
  scheduleRunId?: string;
  sourceId?: string;
} = {}): Promise<Log[]> {
  const limit = boundedLimit(options.limit, 50);
  const offset = boundedOffset(options.offset);
  let query = getSupabaseServiceClient()
    .from("logs")
    .select(LOG_SELECT)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.articleId) query = query.eq("article_id", options.articleId);
  if (options.event) query = query.eq("event", options.event);
  if (options.level) query = query.eq("level", options.level);
  if (options.scheduleId) query = query.eq("schedule_id", options.scheduleId);
  if (options.scheduleRunId) {
    query = query.eq("schedule_run_id", options.scheduleRunId);
  }
  if (options.sourceId) query = query.eq("source_id", options.sourceId);

  const { data, error } = await query;
  if (error) throw databaseError("list recent logs", error);
  return data;
}

