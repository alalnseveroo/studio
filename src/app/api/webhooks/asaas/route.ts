
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Este endpoint irá receber as notificações de webhook do Asaas.
// Você precisa configurar esta URL no seu painel do Asaas:
// https://<seu-dominio>/api/webhooks/asaas

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body.event;

    console.log('Webhook Asaas recebido:', JSON.stringify(body, null, 2));

    // Verificamos se o evento é uma confirmação ou recebimento de pagamento
    if (eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED') {
      const payment = body.payment;

      if (!payment || !payment.customer || !payment.value) {
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
    }

    // Retorna uma resposta de sucesso para o Asaas para confirmar o recebimento.
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro ao processar webhook do Asaas:', error.message);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
