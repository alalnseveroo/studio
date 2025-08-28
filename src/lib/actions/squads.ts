
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSquad(name: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } }
  }

  const { data, error } = await supabase
    .from('squads')
    .insert({
      name,
      agency_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase error creating squad:', error)
    return { error: { message: `Não foi possível criar o squad: ${error.message}` } }
  }

  revalidatePath('/dashboard/squads')
  return { data, error: null }
}


export async function getSquads() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: 'Usuário não autenticado.' } };

    const { data, error } = await supabase
        .from('squads')
        .select('*')
        .eq('agency_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase error fetching squads:', error);
        return { data: null, error: { message: 'Não foi possível buscar os squads.' } };
    }

    return { data, error: null };
}
