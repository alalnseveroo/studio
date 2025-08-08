
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ClientFormData } from '@/app/dashboard/clientes/[id]/page';

const AVATAR_URLS = [
    'https://ktgckactmaqioszffuyx.supabase.co/storage/v1/object/public/icons/Ellipse%201.png',
    'https://ktgckactmaqioszffuyx.supabase.co/storage/v1/object/public/icons/Ellipse%202.png',
    'https://ktgckactmaqioszffuyx.supabase.co/storage/v1/object/public/icons/Ellipse%203.png'
];

export async function addClient(name: string, personType: 'cpf' | 'cnpj') {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado.' } }
  }

  const clientId = `CL#${Math.floor(100000 + Math.random() * 900000)}`;
  const avatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];

  const clientData: any = {
    user_id: user.id,
    client_id: clientId,
    avatar_url: avatarUrl,
    person_type: personType
  };
  
  if (personType === 'cpf') {
      clientData.full_name = name;
  } else {
      clientData.company_name = name;
  }


  const { data, error } = await supabase.from('clientes').insert(clientData).select().single()

  if (error) {
    console.error('Supabase error:', error)
    return { data: null, error: { message: `Não foi possível adicionar o cliente: ${error.message}` } }
  }
  
  revalidatePath('/dashboard/clientes')
  return { data, error: null }
}


export async function createFullClient(formData: any) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado.' } }
  }

  const clientId = `CL#${Math.floor(100000 + Math.random() * 900000)}`;
  const avatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];
  const address = formData.cep ? `${formData.street}, ${formData.number}${formData.complement ? `, ${formData.complement}` : ''} - ${formData.neighborhood}, ${formData.city} - ${formData.state}, CEP: ${formData.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}` : '';

  const clientData = {
    user_id: user.id,
    client_id: clientId,
    avatar_url: avatarUrl,
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
    address: address || null,
  };


  const { data, error } = await supabase.from('clientes').insert(clientData).select().single()

  if (error) {
    console.error('Supabase error:', error)
    return { data: null, error: { message: `Não foi possível adicionar o cliente: ${error.message}` } }
  }
  
  revalidatePath('/dashboard/clientes')
  return { data, error: null }
}


export async function getClients() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: 'Usuário não autenticado.' } };

    const { data, error } = await supabase.from('clientes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

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

export async function updateClientProfile(id: string, formData: ClientFormData & { address: string }) {
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

    