
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/constants'

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a server-side context
// as it has admin privileges and can bypass your RLS policies.

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !supabaseServiceKey) {
  // Em um ambiente de build/server, é preferível lançar um erro se as variáveis críticas não estiverem definidas.
  // No entanto, para evitar que o build quebre se a variável não estiver presente temporariamente,
  // podemos logar um erro crítico. A inicialização abaixo irá falhar de qualquer maneira se as chaves forem nulas.
  console.error("Supabase URL or Service Role Key is not defined in environment variables.");
}

const supabaseAdmin = createClient(
  SUPABASE_URL,
  supabaseServiceKey! // A exclamação indica ao TypeScript que confiamos que a variável está definida neste ponto.
)

export { supabaseAdmin }
