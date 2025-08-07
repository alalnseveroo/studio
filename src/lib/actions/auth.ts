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
      // This will be the page where the user lands after clicking the link in the email.
      // We are not using email link authentication, but OTP, so this is not strictly necessary for the OTP flow itself.
      // However, it's good practice to have it. The user will be redirected to the verify-otp page from the client side anyway.
      emailRedirectTo: new URL('/verify-otp', process.env.NEXT_PUBLIC_SITE_URL).toString(),
    },
  })

  if (error) {
    return { error: { message: `Não foi possível enviar o OTP: ${error.message}` } }
  }

  return { error: null }
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
  // We will handle redirection on the client side after this action returns successfully.
  // redirect('/dashboard')
  return { error: null }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}
