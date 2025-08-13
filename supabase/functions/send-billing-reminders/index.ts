
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format } from 'https://deno.land/std@0.208.0/datetime/mod.ts';

// Importa a função de envio de e-mail do diretório lib.
// O caminho deve ser ajustado com base na sua estrutura de monorepo ou conforme necessário.
// Esta abordagem de importação pode exigir configuração adicional (e.g., import maps).
// Por simplicidade, vamos duplicar a lógica de envio de e-mail aqui.

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');

async function sendEmailViaBrevo(toEmail, templateId, params) {
  if (!BREVO_API_KEY) {
    console.error('Brevo API key is not set.');
    return;
  }

  const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
  
  const body = {
    to: [{ email: toEmail }],
    templateId: templateId,
    params: params,
  };

  try {
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
      throw new Error(`Brevo API Error: ${errorData.message}`);
    }
    console.log(`Email sent successfully to ${toEmail} with template ${templateId}`);
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
}

// O Deno.serve é o ponto de entrada para as Edge Functions no Supabase.
Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Pega a data de hoje e calcula ontem e amanhã
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    // 2. Busca todas as cobranças pendentes
    const { data: charges, error: chargesError } = await supabaseClient
      .from('cobrancas')
      .select(`
        *,
        clientes (email, full_name, company_name),
        profiles (full_name, company_name)
      `)
      .eq('status', 'pendente');

    if (chargesError) throw chargesError;

    if (!charges || charges.length === 0) {
      console.log('No pending charges found. Exiting.');
      return new Response(JSON.stringify({ message: 'No pending charges to process.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    // 3. Itera sobre as cobranças e envia os e-mails
    for (const charge of charges) {
      const dueDate = charge.due_date;
      const clientEmail = charge.clientes?.email;
      
      if (!clientEmail) continue; // Pula se o cliente não tiver e-mail

      const portalUrl = new URL(`/portal/${charge.cliente_id}`, Deno.env.get('NEXT_PUBLIC_SITE_URL')).toString();
      const params = {
          CLIENTE_NOME: charge.clientes.full_name || charge.clientes.company_name,
          CONTRATADA_NOME: charge.profiles.full_name || charge.profiles.company_name,
          COBRANCA_VALOR: (charge.value || 0).toFixed(2),
          COBRANCA_VENCIMENTO: format(new Date(dueDate), 'dd/MM/yyyy'),
          LINK_PORTAL: portalUrl,
      };

      // Envia lembrete 1 dia ANTES do vencimento
      if (dueDate === tomorrowStr) {
        await sendEmailViaBrevo(clientEmail, 61, params);
      }
      
      // Envia aviso de atraso 1 dia DEPOIS do vencimento
      if (dueDate === yesterdayStr) {
        await sendEmailViaBrevo(clientEmail, 64, params);
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${charges.length} charges.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in cron job:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
