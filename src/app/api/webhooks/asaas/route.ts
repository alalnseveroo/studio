
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    const body = await req.json();
    const eventType = body.event;

    console.log('Webhook Asaas recebido:', eventType);

    // Processa apenas os eventos que confirmam um pagamento de fato
    if (eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED') {
      const payment = body.payment;

      if (!payment || !payment.customer || !payment.value) {
        console.error('Payload de pagamento inválido recebido do Asaas.');
        // Retorna 200 para não recebermos re-tentativas de um webhook malformado.
        return NextResponse.json({ error: 'Payload de pagamento inválido.' }, { status: 200 });
      }
      
      const asaasCustomerId = payment.customer;
      const paidValue = payment.value;
      const creditsToAdd = Math.floor(paidValue / 7);

      if (creditsToAdd <= 0) {
        console.log(`Pagamento de R$ ${paidValue} não resulta em créditos. Ignorando.`);
        return NextResponse.json({ success: true, message: 'Nenhum crédito a adicionar.' });
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, credits')
        .eq('asaas_customer_id', asaasCustomerId)
        .single();

      if (profileError || !profile) {
        console.error(`Perfil não encontrado para o asaas_customer_id: ${asaasCustomerId}`, profileError);
        // Retorna 200 para que o Asaas não tente reenviar o webhook. O erro é do nosso lado.
        return NextResponse.json({ error: 'Perfil do cliente não encontrado no nosso sistema.' }, { status: 200 });
      }

      const currentCredits = profile.credits || 0;
      const newTotalCredits = currentCredits + creditsToAdd;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newTotalCredits, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`Erro ao atualizar créditos para o perfil ${profile.id}:`, updateError);
        return NextResponse.json({ error: 'Erro ao atualizar créditos do usuário.' }, { status: 500 });
      }

      console.log(`Sucesso! ${creditsToAdd} créditos adicionados ao perfil ${profile.id}. Novo total: ${newTotalCredits}`);
    
    } else {
        // Ignora outros eventos (como PAYMENT_CREATED) para evitar erros
        console.log(`Evento '${eventType}' recebido e ignorado com sucesso.`);
    }

    // Retorna sucesso para todos os eventos recebidos que não resultaram em erro
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro ao processar webhook do Asaas:', error.message);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
