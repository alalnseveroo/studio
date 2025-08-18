
import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { createAdminClient } from '@/lib/supabase/admin';

// Este endpoint irá receber as notificações de webhook do Asaas.
// Você precisa configurar esta URL no seu painel do Asaas:
// https://<seu-dominio>/api/webhooks/asaas

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body.event;

    console.log('Webhook Asaas recebido:', eventType);

    // Verificamos se o evento é uma confirmação ou recebimento de pagamento
    if (eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED') {
      const payment = body.payment;

      if (!payment || !payment.customer || !payment.value) {
        console.error('Payload de pagamento inválido recebido do Asaas.');
        return NextResponse.json({ error: 'Payload de pagamento inválido.' }, { status: 400 });
      }

      const customerId = payment.customer;
      const paidValue = payment.value;
      const creditsToAdd = Math.floor(paidValue / 5);

      if (creditsToAdd <= 0) {
        console.log(`Pagamento de R$ ${paidValue} não resulta em créditos. Ignorando.`);
        return NextResponse.json({ success: true, message: 'Nenhum crédito a adicionar.' });
      }
      
      const supabase = createAdminClient();

      // Encontra o perfil do usuário no nosso banco de dados usando o ID do cliente do Asaas
      // A busca pode ser tanto na tabela de profiles (para o dono da conta) quanto na de clientes
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, credits')
        .eq('asaas_customer_id', customerId)
        .single();

      if (profileError || !profile) {
        console.error(`Perfil não encontrado para o asaas_customer_id: ${customerId}`, profileError);
        // Retornamos 200 para que o Asaas não tente reenviar, pois o erro é do nosso lado.
        return NextResponse.json({ error: 'Perfil do cliente não encontrado no nosso sistema.' }, { status: 200 });
      }

      // Calcula os novos créditos
      const currentCredits = profile.credits || 0;
      const newTotalCredits = currentCredits + creditsToAdd;

      // Atualiza o perfil do usuário com os novos créditos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newTotalCredits, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`Erro ao atualizar créditos para o perfil ${profile.id}:`, updateError);
        // Retornamos 500 para que o Asaas possa tentar reenviar o webhook
        return NextResponse.json({ error: 'Erro ao atualizar créditos do usuário.' }, { status: 500 });
      }

      console.log(`Sucesso! ${creditsToAdd} créditos adicionados ao perfil ${profile.id}. Novo total: ${newTotalCredits}`);
    
    } else {
        // Se for qualquer outro evento (como PAYMENT_CREATED), apenas acuse o recebimento.
        console.log(`Evento '${eventType}' recebido e ignorado.`);
    }

    // Retorna uma resposta de sucesso para o Asaas para confirmar o recebimento.
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro ao processar webhook do Asaas:', error.message);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
=======
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// No 'use server', pois esta é uma rota de API
// Não usar o helper `createClient` do Supabase aqui, pois ele depende de cookies de sessão que não existirão em um webhook.
// Usaremos o cliente admin.

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase URL or Service Role Key is not configured.');
      return new NextResponse(JSON.stringify({ error: 'Internal server configuration error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload = await request.json();
    console.log('Webhook Asaas recebido:', JSON.stringify(payload, null, 2));
    
    // Verificação de segurança (opcional, mas recomendado)
    // const asaasToken = request.headers.get('asaas-webhook-token');
    // if (asaasToken !== process.env.ASAAS_WEBHOOK_SECRET) {
    //   return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    // }

    const event = payload.event;
    const payment = payload.payment;
    
    if (!event || !payment || !payment.id) {
        return new NextResponse(JSON.stringify({ error: 'Payload inválido' }), { status: 400 });
    }

    if (event === 'PAYMENT_RECEIVED') {
      const asaasPaymentId = payment.id;
      
      const { error: updateError } = await supabaseAdmin
        .from('cobrancas')
        .update({ status: 'pago', paid_at: new Date().toISOString() })
        .eq('asaas_payment_id', asaasPaymentId);
        
      if (updateError) {
        console.error(`Erro ao atualizar cobrança para o payment_id ${asaasPaymentId}:`, updateError);
        // Retorna 200 para o Asaas não tentar reenviar, mas loga o erro.
        return new NextResponse(JSON.stringify({ message: 'Webhook recebido, mas falha ao atualizar banco de dados.' }), { status: 200 });
      }

      console.log(`Cobrança com asaas_payment_id ${asaasPaymentId} marcada como paga.`);
    }

    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });

  } catch (error: any) {
    console.error('Erro ao processar webhook do Asaas:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao processar a requisição.' }), { status: 500 });
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e
  }
}
