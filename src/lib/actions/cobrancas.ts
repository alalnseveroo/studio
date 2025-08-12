
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCharges() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: 'Usuário não autenticado.' } };

    // Primeiro, chama a função para gerar cobranças, se necessário.
    const { error: rpcError } = await supabase.rpc('generate_monthly_charges');

    if (rpcError) {
        console.error('Error calling generate_monthly_charges:', rpcError);
        // Não bloqueia a busca, apenas loga o erro.
    }

    const { data, error } = await supabase
        .from('cobrancas')
        .select(`
            *,
            clientes (id, full_name, company_name, avatar_url, email)
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

    if (error) {
        console.error('Supabase error getting charges:', error);
        return { data: null, error: { message: 'Não foi possível buscar as cobranças.' } };
    }

    return { data, error: null };
}

export async function getChargesByClientId(clientId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: 'Usuário não autenticado.' } };

    const { data, error } = await supabase
        .from('cobrancas')
        .select('*')
        .eq('user_id', user.id)
        .eq('cliente_id', clientId)
        .order('due_date', { ascending: false });

    if (error) {
        console.error('Supabase error getting charges by client:', error);
        return { data: null, error: { message: 'Não foi possível buscar as cobranças do cliente.' } };
    }

    return { data, error: null };
}

export async function markChargeAsPaid(chargeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } };
  }

  const { error } = await supabase
    .from('cobrancas')
    .update({
      status: 'pago',
      paid_at: new Date().toISOString(),
    })
    .eq('id', chargeId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Supabase error marking as paid:', error);
    return { error: { message: 'Não foi possível marcar a cobrança como paga.' } };
  }

  revalidatePath('/dashboard/cobrancas');
  revalidatePath('/dashboard/clientes/*'); // Revalida a página de detalhes do cliente
  return { error: null };
}

    