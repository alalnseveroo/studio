'use server'

import { createClient } from '@/lib/supabase/server'
import { createAsaasCharge, createAsaasPaymentLink } from '@/lib/asaas'
import { getProfile } from './profile'

interface PurchaseResult {
  paymentId?: string;
  paymentLink?: string;
  error?: string;
}

export async function purchaseCredits(planId: string): Promise<PurchaseResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  const { data: profile } = await getProfile();
  if (!profile) {
    return { error: 'Não foi possível carregar os dados do seu perfil.' }
  }

  const { asaas_customer_id } = profile;
  if (!asaas_customer_id) {
    return { error: 'Sua conta de pagamentos não foi encontrada. Contate o suporte.' }
  }

  let description = '';
  let value = 0;
  let credits_purchased = 0;

  if (planId === 'professional') {
      description = 'Assinatura Plano Profissional Crivo - Mensal';
      value = 49.90;
      credits_purchased = 999; // Represents unlimited
  } else if (planId === 'flexible') {
      // This is a placeholder, as the modal seems to redirect for this plan.
      // Assuming a credit purchase of 2 credits for R$20.
      description = 'Compra de 2 créditos Crivo';
      value = 20.00;
      credits_purchased = 2;
  } else {
      return { error: 'Plano inválido.' }
  }

  const { payment, error: chargeError } = await createAsaasCharge({
      customer: asaas_customer_id,
      value: value,
      dueDate: new Date().toISOString().split('T')[0],
      description: description,
  });

  if (chargeError || !payment) {
      return { error: chargeError?.message || 'Ocorreu um erro ao criar a cobrança.' };
  }

  // Save the transaction to the database
  const { error: dbError } = await supabase.from('credit_purchases').insert({
    user_id: user.id,
    asaas_charge_id: payment.id,
    amount: value,
    credits_purchased: credits_purchased,
    status: 'pending',
  });

  if (dbError) {
    // This is a critical error. The charge was created in Asaas but not saved locally.
    // This needs monitoring and potentially a webhook for reconciliation.
    console.error(`Critical Error: Failed to save credit purchase for user ${user.id} and asaas charge ${payment.id}. DB Error: ${dbError.message}`);
    return { error: `Ocorreu um erro ao salvar sua compra. Por favor, contate o suporte e informe o ID da cobrança: ${payment.id}` };
  }

  const { link, error: linkError } = await createAsaasPaymentLink(payment.id);

  if (linkError || !link) {
      return { error: linkError?.message || 'Ocorreu um erro ao gerar o link de pagamento.' };
  }

  return { paymentId: payment.id, paymentLink: link };
}
