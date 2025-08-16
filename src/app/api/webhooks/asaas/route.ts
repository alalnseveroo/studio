
import { NextRequest, NextResponse } from 'next/server';
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
  }
}
