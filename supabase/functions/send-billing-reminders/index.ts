import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format } from 'https://deno.land/std@0.208.0/datetime/mod.ts';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function sendEmailViaBrevo(toEmail: string, templateId: number, params: object) {
  if (!BREVO_API_KEY) {
    throw new Error('Brevo API key is not set.');
  }

  const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
  
  const body = {
    to: [{ email: toEmail }],
    templateId: templateId,
    params: params,
  };

  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Brevo API Error for ${toEmail}:`, errorData);
    throw new Error(`Brevo API Error: ${errorData.message || 'Unknown error'}`);
  }
  console.log(`Email sent successfully to ${toEmail} with template ${templateId}`);
}

async function getProviderProfile(supabase: SupabaseClient, userId: string): Promise<any> {
    const { data, error } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', userId)
        .single();
    if (error) {
        console.error(`Error fetching profile for user ${userId}:`, error.message);
        return null; // Retorna nulo se não encontrar, para não quebrar o loop
    }
    return data;
}

Deno.serve(async (_req) => {
  try {
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not found in environment variables.");
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    const { data: charges, error: chargesError } = await supabaseClient
      .from('cobrancas')
      .select('*, clientes (email, full_name, company_name)')
      .eq('status', 'pendente');

    if (chargesError) throw chargesError;

    if (!charges || charges.length === 0) {
      console.log('No pending charges found. Exiting.');
      return new Response(JSON.stringify({ message: 'No pending charges to process.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    for (const charge of charges) {
      try {
        const dueDate = charge.due_date;
        const clientEmail = charge.clientes?.email;
        
        if (!clientEmail) {
            console.warn(`Skipping charge ${charge.id}: Client email is missing.`);
            continue; 
        }

        const providerProfile = await getProviderProfile(supabaseClient, charge.user_id);
        if (!providerProfile) {
            console.warn(`Skipping charge ${charge.id}: Provider profile not found.`);
            continue;
        }

        const portalUrl = new URL(`/portal/${charge.cliente_id}`, Deno.env.get('NEXT_PUBLIC_SITE_URL')).toString();
        const params = {
            CLIENTE_NOME: charge.clientes.full_name || charge.clientes.company_name || 'Prezado(a)',
            CONTRATADA_NOME: providerProfile.full_name || providerProfile.company_name || 'Sua Assistente Virtual',
            COBRANCA_VALOR: (charge.value || 0).toFixed(2).replace('.', ','),
            COBRANCA_VENCIMENTO: format(new Date(dueDate + 'T00:00:00'), 'dd/MM/yyyy'),
            LINK_PORTAL: portalUrl,
        };

        if (dueDate === tomorrowStr) {
          console.log(`Sending reminder email for charge ${charge.id} due tomorrow.`);
          await sendEmailViaBrevo(clientEmail, 61, params); // Lembrete de vencimento
        }
        
        if (dueDate === yesterdayStr) {
          console.log(`Sending overdue email for charge ${charge.id} due yesterday.`);
          await sendEmailViaBrevo(clientEmail, 64, params); // Cobrança em atraso
        }
      } catch (innerError) {
          console.error(`Failed to process charge ${charge.id}:`, innerError.message);
          // Continua para a próxima cobrança em vez de parar a execução
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${charges.length} charges.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Critical error in cron job:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
