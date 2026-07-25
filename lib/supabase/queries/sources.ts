import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  Source,
  SourceInsert,
  SourceUpdate,
} from "@/lib/supabase/types";
import { databaseError } from "@/lib/supabase/queries/shared";

export type ActiveSourceSelection = {
  ids?: readonly string[];
  names?: readonly string[];
};

export async function listActiveSources(
  selection: ActiveSourceSelection = {},
): Promise<Source[]> {
  let query = getSupabaseServiceClient()
    .from("sources")
    .select(
      "id,name,listing_url,parser_strategy,is_active,logo_url,created_at,updated_at",
    )
    .eq("is_active", true)
    .order("name");

  if (selection.ids?.length) {
    query = query.in("id", [...selection.ids]);
  }

  if (selection.names?.length) {
    query = query.in("name", [...selection.names]);
  }

  const { data, error } = await query;
  if (error) throw databaseError("list active sources", error);
  return data;
}

export async function getSourceById(id: string): Promise<Source | null> {
  const { data, error } = await getSupabaseServiceClient()
    .from("sources")
    .select(
      "id,name,listing_url,parser_strategy,is_active,logo_url,created_at,updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw databaseError("get source", error);
  return data;
}

export async function createSource(input: SourceInsert): Promise<Source> {
  const { data, error } = await getSupabaseServiceClient()
    .from("sources")
    .insert(input)
    .select(
      "id,name,listing_url,parser_strategy,is_active,logo_url,created_at,updated_at",
    )
    .single();

  if (error) throw databaseError("create source", error);
  return data;
}

export async function updateSource(
  id: string,
  input: SourceUpdate,
): Promise<Source> {
  const { data, error } = await getSupabaseServiceClient()
    .from("sources")
    .update(input)
    .eq("id", id)
    .select(
      "id,name,listing_url,parser_strategy,is_active,logo_url,created_at,updated_at",
    )
    .single();

  if (error) throw databaseError("update source", error);
  return data;
}

