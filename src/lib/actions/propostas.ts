'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface PropostaFormData {
  name: string;
  services: string[];
}

export async function createProposal(formData: PropostaFormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } }
  }

  const { data, error } = await supabase
    .from('propostas')
    .insert({
      user_id: user.id,
      name: formData.name,
      services: formData.services,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return { error: { message: `Não foi possível criar a proposta: ${error.message}` } }
  }

  revalidatePath('/dashboard/propostas')
  // O redirect vai ser chamado do lado do cliente após a resposta de sucesso
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
