
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/constants'

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !supabaseServiceKey) {
    throw new Error("Supabase URL or Service Role Key is not defined in environment variables. This must be set in your deployment environment.");
  }
  
  supabaseAdmin = createClient(
      SUPABASE_URL,
      supabaseServiceKey
  );

  return supabaseAdmin;
}
