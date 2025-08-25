'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getFinancialGoal() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado.' } }
  }

  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Ignore 'not found' error (PGRST116), as it's expected if a user hasn't set a goal yet.
  if (error && error.code !== 'PGRST116') { 
    console.error('Error fetching financial goal:', error)
    return { data: null, error: { message: 'Erro ao buscar meta financeira.' } }
  }

  return { data, error: null }
}

export async function upsertFinancialGoal(goalAmount: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado.' } }
  }

  if (typeof goalAmount !== 'number' || goalAmount < 0) {
      return { data: null, error: { message: 'O valor da meta deve ser um número positivo.'} }
  }

  const { data, error } = await supabase
    .from('financial_goals')
    .upsert({
      user_id: user.id,
      goal_amount: goalAmount,
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    console.error('Error upserting financial goal:', error)
    return { data: null, error: { message: `Não foi possível salvar a meta: ${error.message}` } }
  }

  revalidatePath('/dashboard')
  return { data, error: null }
}
