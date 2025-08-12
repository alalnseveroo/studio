
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/constants'

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a server-side context
// as it has admin privileges and can bypass your RLS policies.
const supabaseAdmin = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export { supabaseAdmin }
