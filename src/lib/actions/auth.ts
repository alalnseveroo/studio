
'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto';
import { addOrUpdateContact, sendTransactionalEmail } from '../brevo';
import { createAdminClient } from '../supabase/admin';
import { redirect } from 'next/navigation';

export async function signInWithOtp(email: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  })

  if (error) {
    return { error: { message: `Não foi possível enviar o OTP: ${error.message}` } }
  }

  return { error: null, success: true }
}


export async function sendSignatureOtp() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: { message: 'Usuário não autenticado ou e-mail não encontrado.' }, success: false };
  }

  const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
          shouldCreateUser: false
      }
  });
  
  if (error) {
     return { error: { message: `Não foi possível enviar o OTP: ${error.message}` }, success: false };
  }

  return { error: null, success: true, email: user.email };
}

export async function sendClientVerificationCode(contractId: string) {
  const supabase = createClient();
  
  const { data: contract, error: contractError } = await supabase
    .from('contratos')
    .select('*, clientes:cliente_id (email, full_name, company_name)')
    .eq('id', contractId)
    .single();

  if (contractError || !contract || !contract.clientes?.email) {
      console.error("Error fetching contract or client email:", contractError);
      return { success: false, error: { message: 'Contrato ou e-mail do cliente não encontrado.' } };
  }

  const clientEmail = contract.clientes.email;
  const clientName = contract.clientes.full_name || contract.clientes.company_name;
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos de validade

  const { error: updateError } = await supabase
    .from('contratos')
    .update({
        client_signature_otp: code,
        client_signature_otp_expires_at: expiresAt.toISOString()
    })
    .eq('id', contractId);

  if (updateError) {
      return { success: false, error: { message: 'Falha ao salvar o código de verificação no banco de dados.' } };
  }
  
  try {
    const BREVO_TEMPLATE_ID = 58; 
    await sendTransactionalEmail({
        toEmail: clientEmail,
        templateId: BREVO_TEMPLATE_ID,
        params: { 
            PINSECRET: code,
            NOME_CLIENTE: clientName,
        },
        userId: contract.user_id
    });

    return { success: true, message: `Um e-mail com o código de verificação foi enviado para ${clientEmail}.` };
  } catch (brevoError: any) {
    console.error("Brevo API Error:", brevoError);
    return { success: false, error: { message: `Falha ao enviar o e-mail de verificação. Detalhes: ${brevoError.message}` } };
  }
}

// Nova função para OTP do portal
export async function sendPortalOtp(chargeId: string) {
  const supabase = createClient();

  const { data: charge, error: chargeError } = await supabase
    .from('cobrancas')
    .select('id, user_id, clientes (id, email, full_name, company_name)')
    .eq('id', chargeId)
    .single();

  if (chargeError || !charge || !charge.clientes?.email) {
    return { success: false, error: { message: 'Cobrança ou e-mail do cliente não encontrado.' } };
  }

  const clientEmail = charge.clientes.email;
  const clientName = charge.clientes.full_name || charge.clientes.company_name;
  const code = crypto.randomInt(100000, 999999).toString();

  // Salva o OTP no localStorage do navegador do cliente seria inseguro.
  // A verificação deve ser feita no servidor.
  // Vamos armazenar o OTP temporariamente na tabela de cobranças.
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos de validade

  const { error: updateError } = await supabase
    .from('cobrancas')
    .update({ 
        download_otp: code, 
        download_otp_expires_at: expiresAt.toISOString() 
    })
    .eq('id', chargeId);

  if (updateError) {
    return { success: false, error: { message: 'Falha ao salvar o código de verificação.' } };
  }

  try {
    const BREVO_TEMPLATE_ID = 59; // Template para "Download de NF-e"
    await sendTransactionalEmail({
        toEmail: clientEmail,
        templateId: BREVO_TEMPLATE_ID,
        params: { 
            CLIENTE_NOME: clientName,
            PINSECRET: code,
        },
        userId: charge.user_id
    });
    return { success: true, message: `Um código foi enviado para ${clientEmail}.` };
  } catch (brevoError: any) {
    console.error("Brevo API Error:", brevoError);
    return { success: false, error: { message: `Falha ao enviar o e-mail de verificação. Detalhes: ${brevoError.message}` } };
  }
}


export async function verifyOtp(email: string, token: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error || !data.session) {
    return { error: { message: `Não foi possível verificar o OTP. O código pode ser inválido ou ter expirado. Por favor, tente novamente. ${error?.message || ''}` } }
  }

  return { error: null }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}
