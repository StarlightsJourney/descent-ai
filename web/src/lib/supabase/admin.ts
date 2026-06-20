import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { getRequiredEnv } from "@/lib/env";

export function createAdminClient() {
  return createClient<Database>(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SECRET_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
