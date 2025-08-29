
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCharges() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: 'Usuário não autenticado.' } };

    // A geração de cobranças agora é feita pela função de cron: supabase/functions/billing-cron/index.ts
    // A chamada RPC foi removida para evitar o erro.

    const { data, error } = await supabase
        .from('cobrancas')
        .select(`
            *,
            clientes (*)
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });

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

export async function getChargesForClientPortal(clientId: string) {
    // Usando o cliente server-side que pode ser usado em contextos sem autenticação de usuário (como portais públicos)
    // A segurança é garantida pela RLS da tabela 'cobrancas' que deve permitir leitura pública ou baseada em um segredo/token se necessário.
    // Assumindo que a RLS permite leitura se o `cliente_id` for correspondente, ou que a tabela é publicamente legível (com cuidado).
    // Para este caso, vamos criar uma política de RLS mais permissiva para SELECT.
    const supabase = createClient()
    const { data, error } = await supabase
        .from('cobrancas')
        .select('*')
        .eq('cliente_id', clientId)
        .order('due_date', { ascending: false });

     if (error) {
        console.error('Supabase error getting charges for client portal:', error);
        return { data: null, error: { message: 'Não foi possível buscar o histórico de cobranças.' } };
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
  revalidatePath('/portal/*');
  return { error: null };
}

export async function deleteCharge(chargeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } };
  }

  // Primeiro, verifique se a cobrança está pendente
  const { data: charge, error: fetchError } = await supabase
    .from('cobrancas')
    .select('status')
    .eq('id', chargeId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !charge) {
    return { error: { message: 'Cobrança não encontrada ou você não tem permissão para excluí-la.' } };
  }

  if (charge.status !== 'pendente') {
    return { error: { message: 'Apenas cobranças pendentes podem ser excluídas.' } };
  }

  const { error: deleteError } = await supabase
    .from('cobrancas')
    .delete()
    .eq('id', chargeId);

  if (deleteError) {
    console.error('Supabase error deleting charge:', deleteError);
    return { error: { message: 'Não foi possível excluir a cobrança.' } };
  }

  revalidatePath('/dashboard/cobrancas');
  revalidatePath('/dashboard/clientes/*');
  revalidatePath('/portal/*');
  return { error: null };
}


export async function saveInvoiceUrl(chargeId: string, invoiceUrl: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: { message: 'Usuário não autenticado.' } };
    }

    const { error } = await supabase
        .from('cobrancas')
        .update({ invoice_url: invoiceUrl, updated_at: new Date().toISOString() })
        .eq('id', chargeId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Supabase error saving invoice URL:', error);
        return { error: { message: `Não foi possível salvar o link da nota fiscal: ${error.message}` } };
    }
    
    revalidatePath('/dashboard/cobrancas');
    revalidatePath('/portal/*');
    return { error: null };
}
