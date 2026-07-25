import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

let serviceClient: SupabaseClient<Database> | undefined;

function requireServerEnvironment(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local before using Supabase data access.`,
    );
  }

  return value;
}

export function getSupabaseServiceClient(): SupabaseClient<Database> {
  if (serviceClient) return serviceClient;

  const url = requireServerEnvironment("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireServerEnvironment("SUPABASE_SERVICE_ROLE_KEY");

  serviceClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return serviceClient;
}

