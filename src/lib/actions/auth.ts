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

  return { error: null }
}


export async function sendSignatureOtp() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: { message: 'Usuário não autenticado ou e-mail não encontrado.' } };
  }

  // Envia um OTP que pode ser verificado sem alterar a sessão do usuário.
  // Usa o template de "Email change" como um OTP genérico de verificação.
  const { error } = await supabase.auth.reauthenticate();
  
  if (error) {
     return { error: { message: `Não foi possível enviar o OTP: ${error.message}` } };
  }

  return { error: null, success: true, email: user.email };
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