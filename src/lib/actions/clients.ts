
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Cliente } from '@/lib/types';
import { addOrUpdateContact } from '../brevo';
import { buttonVariants } from '@/components/ui/button';

const AVATAR_URLS = [
    'https://ktgckactmaqioszffuyx.supabase.co/storage/v1/object/public/icons/Ellipse%201.png',
    'https://ktgckactmaqioszffuyx.supabase.co/storage/v1/object/public/icons/Ellipse%202.png',
    'https://ktgckactmaqioszffuyx.supabase.co/storage/v1/object/public/icons/Ellipse%203.png'
];

export async function createFullClient(formData: any) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado.' } }
  }

  const clientId = `CL#${Math.floor(100000 + Math.random() * 900000)}`;
  const avatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];
  
  const billingStatus = formData.firstChargeAction === 'manual' ? 'pending_approval' : 'active';

  const clientData = {
    user_id: user.id,
    client_id: clientId,
    avatar_url: avatarUrl,
    full_name: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    cpf: formData.document, // Usando o campo 'document' para CPF/CNPJ
    
    // Billing info from wizard
    proposal_id: formData.proposalId || null,
    value: parseFloat(formData.value),
    payment_day: parseInt(formData.paymentDay, 10),
    first_charge_date: formData.firstChargeDate.toISOString(),
    billing_status: billingStatus,
    
    // Default person_type para simplificar, já que o wizard foca em PF por enquanto
    person_type: 'cpf' as const, 
  };


  const { data, error } = await supabase.from('clientes').insert(clientData).select().single()

  if (error) {
    console.error('Supabase error:', error)
    return { data: null, error: { message: `Não foi possível adicionar o cliente: ${error.message}` } }
  }
  
  // Após criar o cliente no Supabase, cria/atualiza na Brevo
  try {
    if (data.email) {
      await addOrUpdateContact(data.email, { NOME_CLIENTE: data.full_name || '' });
    }
  } catch (brevoError: any) {
    // Não impede o fluxo principal, mas loga o erro
    console.warn(`Falha ao sincronizar cliente com Brevo: ${brevoError.message}`);
  }

  revalidatePath('/dashboard/clientes')
  revalidatePath('/dashboard/cobrancas')
  return { data, error: null }
}


export async function getClients() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: 'Usuário não autenticado.' } };

    const { data, error } = await supabase
        .from('clientes')
        .select('*, propostas(*)') // Inclui a proposta vinculada
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase error:', error);
        return { data: null, error: { message: 'Não foi possível buscar os clientes.' } };
    }

    return { data, error: null };
}

export async function getClientById(id: string) {
    const supabase = createClient()
    
    // A política de RLS foi ajustada para permitir leitura pública se o id do cliente for correspondente.
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Supabase error:', error);
        return { data: null, error: { message: 'Não foi possível buscar os dados do cliente.' } };
    }

    return { data, error: null };
}

export async function updateClientProfile(id: string, formData: any) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } }
  }

  const profileData = {
    email: formData.email,
    person_type: formData.personType,
    company_name: formData.personType === 'cnpj' ? formData.companyName : null,
    cnpj: formData.personType === 'cnpj' ? formData.cnpj : null,
    representative_name: formData.personType === 'cnpj' ? formData.representativeName : null,
    representative_cpf: formData.personType === 'cnpj' ? formData.representativeCpf : null,
    full_name: formData.personType === 'cpf' ? formData.fullName : null,
    nationality: formData.personType === 'cpf' ? formData.nationality : null,
    civil_status: formData.personType === 'cpf' ? formData.civilStatus : null,
    profession: formData.personType === 'cpf' ? formData.profession : null,
    cpf: formData.personType === 'cpf' ? formData.cpf : null,
    address: formData.address,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('clientes').update(profileData).eq('id', id)

  if (error) {
    console.error('Supabase error:', error)
    return { error: { message: `Não foi possível salvar o perfil do cliente: ${error.message}` } }
  }
  
  revalidatePath('/dashboard/clientes')
  revalidatePath(`/dashboard/clientes/${id}`)
  return { error: null }
}


export async function updateClientFinancials(id: string, financials: { billing_status: 'active' | 'inactive'; proposal_id: string | null }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } };
  }

  const { error } = await supabase
    .from('clientes')
    .update({
      billing_status: financials.billing_status,
      proposal_id: financials.proposal_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Supabase error updating financials:', error);
    return { error: { message: `Não foi possível atualizar as configurações financeiras: ${error.message}` } };
  }

  revalidatePath(`/dashboard/clientes/${id}`);
  revalidatePath('/dashboard/cobrancas');
  return { error: null };
}

export async function deleteClient(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } };
  }

  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Supabase delete error:', error);
    if (error.code === '23503') { // Foreign key violation
        return { error: { message: 'Não é possível excluir este cliente pois ele está associado a contratos ou cobranças existentes.' } };
    }
    return { error: { message: `Não foi possível excluir o cliente: ${error.message}` } };
  }

  revalidatePath('/dashboard/clientes');
  return { error: null };
}
