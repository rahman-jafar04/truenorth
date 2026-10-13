import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

/**
 * Server-side Supabase Admin Client
 * Uses the service role key to independently verify tokens and manage users.
 * Never exposed to mobile client.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
