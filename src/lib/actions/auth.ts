'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInWithOtp(email: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: new URL('/verify-otp', process.env.NEXT_PUBLIC_SITE_URL).toString(),
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

  // Envia um OTP que pode ser verificado sem alterar a sessão do usuário.
  // Usamos o tipo 'email' que é um OTP genérico de verificação.
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

export async function sendClientSignatureOtp(contractId: string) {
  const supabase = createClient();
  
  const { data: contract, error: contractError } = await supabase
    .from('contratos')
    .select('id, clientes (email)')
    .eq('id', contractId)
    .single();

  if (contractError || !contract || !contract.clientes?.email) {
      return { error: { message: 'Contrato ou e--mail do cliente não encontrado.' }, success: false };
  }

  const clientEmail = contract.clientes.email;

  // Usa o método 'resend' que é mais adequado para enviar um OTP para um não-usuário
  // sem acionar a lógica de "signup".
  const { error } = await supabase.auth.resend({
    type: 'signup', // Este tipo funciona para enviar um código de verificação genérico
    email: clientEmail
  });

  if (error) {
    return { error: { message: `Não foi possível enviar o OTP para o cliente: ${error.message}` }, success: false };
  }

  return { error: null, success: true };
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

  revalidatePath('/', 'layout')
  return { error: null }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}
