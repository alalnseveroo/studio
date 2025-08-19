
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, addMonths } from 'https://deno.land/std@0.208.0/datetime/mod.ts';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Helper para enviar e-mails transacionais
async function sendEmailViaBrevo(toEmail: string, templateId: number, params: object) {
  if (!BREVO_API_KEY) throw new Error('Brevo API key is not set.');
  
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
    body: JSON.stringify({ to: [{ email: toEmail }], templateId, params }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Brevo API Error for ${toEmail}:`, errorData);
    throw new Error(`Brevo API Error: ${errorData.message || 'Unknown error'}`);
  }
  console.log(`Email sent successfully to ${toEmail} with template ${templateId}`);
}

// Helper para buscar o perfil do prestador
async function getProviderProfile(supabase: SupabaseClient, userId: string): Promise<any> {
    const { data, error } = await supabase.from('profiles').select('full_name, company_name').eq('id', userId).single();
    if (error) {
        console.error(`Error fetching profile for user ${userId}:`, error.message);
        return null;
    }
    return data;
}

// Função principal do cron job
Deno.serve(async (_req) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not found in environment variables.");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // --- 1. GERAÇÃO DE COBRANÇAS RECORRENTES ---
    const { data: activeClients, error: clientsError } = await supabase
        .from('clientes')
        .select('*')
        .eq('billing_status', 'active')
        .eq('first_charge_date', todayStr);

    if (clientsError) throw new Error(`Error fetching active clients: ${clientsError.message}`);

    for (const client of activeClients || []) {
        if (!client.value || !client.payment_day) {
            console.warn(`Skipping new charge for client ${client.id}: Missing value or payment_day.`);
            continue;
        }

        // Insere a nova cobrança para hoje
        const { error: insertError } = await supabase.from('cobrancas').insert({
            user_id: client.user_id,
            cliente_id: client.id,
            due_date: todayStr,
            value: client.value,
            status: 'pendente',
        });

        if (insertError) {
            console.error(`Failed to create charge for client ${client.id}:`, insertError.message);
        } else {
            // Calcula e atualiza a data da próxima cobrança para o mês seguinte
            const nextChargeDate = format(addMonths(today, 1), 'yyyy-MM-dd');
            const { error: updateError } = await supabase
                .from('clientes')
                .update({ first_charge_date: nextChargeDate })
                .eq('id', client.id);

            if (updateError) {
                console.error(`Failed to update next charge date for client ${client.id}:`, updateError.message);
            } else {
                 console.log(`Successfully created charge and updated next charge date for client ${client.id}`);
            }
        }
    }
    
    // --- 2. ENVIO DE LEMBRETES E AVISOS DE ATRASO ---
    const { data: pendingCharges, error: chargesError } = await supabase
      .from('cobrancas')
      .select('*, clientes (email, full_name, company_name)')
      .eq('status', 'pendente');

    if (chargesError) throw new Error(`Error fetching pending charges: ${chargesError.message}`);

    if (!pendingCharges || pendingCharges.length === 0) {
      console.log('No pending charges to send reminders for.');
    } else {
      const tomorrowStr = format(addMonths(today, 0, 1), 'yyyy-MM-dd');
      const yesterdayStr = format(addMonths(today, 0, -1), 'yyyy-MM-dd');

      for (const charge of pendingCharges) {
        try {
          if (!charge.clientes?.email) {
              console.warn(`Skipping reminder for charge ${charge.id}: Client email is missing.`);
              continue;
          }

          const providerProfile = await getProviderProfile(supabase, charge.user_id);
          if (!providerProfile) {
              console.warn(`Skipping reminder for charge ${charge.id}: Provider profile not found.`);
              continue;
          }

          const portalUrl = new URL(`/portal/${charge.cliente_id}`, Deno.env.get('NEXT_PUBLIC_SITE_URL')).toString();
          const params = {
              CLIENTE_NOME: charge.clientes.full_name || charge.clientes.company_name || 'Prezado(a)',
              CONTRATADA_NOME: providerProfile.full_name || providerProfile.company_name || 'Sua Assistente Virtual',
              COBRANCA_VALOR: (charge.value || 0).toFixed(2).replace('.', ','),
              COBRANCA_VENCIMENTO: format(new Date(charge.due_date + 'T00:00:00'), 'dd/MM/yyyy'),
              LINK_PORTAL: portalUrl,
          };

          if (charge.due_date === tomorrowStr) {
            console.log(`Sending due tomorrow reminder for charge ${charge.id}.`);
            await sendEmailViaBrevo(charge.clientes.email, 61, params);
          } else if (charge.due_date === yesterdayStr) {
            console.log(`Sending overdue reminder for charge ${charge.id}.`);
            await sendEmailViaBrevo(charge.clientes.email, 64, params);
          }
        } catch (innerError) {
            console.error(`Failed to process reminder for charge ${charge.id}:`, innerError.message);
        }
      }
    }

    return new Response(JSON.stringify({ message: "Billing cron job executed successfully." }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Critical error in billing cron job:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
