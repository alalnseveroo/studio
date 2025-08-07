'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProposal(formData: any) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } }
  }

  const { name, services, payment_type, value, value_in_words, payment_day, payment_method, contract_duration_type, contract_duration_months, start_date, end_date, jurisdiction_city, jurisdiction_state } = formData;

  const { data, error } = await supabase
    .from('propostas')
    .insert({
      user_id: user.id,
      name,
      services,
      payment_type,
      value,
      value_in_words,
      payment_day: parseInt(payment_day, 10),
      payment_method,
      contract_duration_type,
      contract_duration_months: contract_duration_type === 'definite' ? parseInt(contract_duration_months, 10) : null,
      start_date,
      end_date: contract_duration_type === 'definite' ? end_date : null,
      jurisdiction_city,
      jurisdiction_state,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return { error: { message: `Não foi possível criar a proposta: ${error.message}` } }
  }

  revalidatePath('/dashboard/propostas')
  return { data, error: null }
}

export async function getProposals() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: 'Usuário não autenticado.' } };

    const { data, error } = await supabase.from('propostas').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase error:', error);
        return { data: null, error: { message: 'Não foi possível buscar as propostas.' } };
    }

    return { data, error: null };
}