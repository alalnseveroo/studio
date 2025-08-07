'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ClientFormData } from '@/app/dashboard/clientes/[id]/page';

const AVATAR_URLS = [
    'https://ktgckactmaqioszffuyx.supabase.co/storage/v1/object/public/icons/Ellipse%201.png',
    'https://ktgckactmaqioszffuyx.supabase.co/storage/v1/object/public/icons/Ellipse%202.png',
    'https://ktgckactmaqioszffuyx.supabase.co/storage/v1/object/public/icons/Ellipse%203.png'
];

export async function addClient(name: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado.' } }
  }

  const clientId = `CL#${Math.floor(100000 + Math.random() * 900000)}`;
  const avatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];

  const clientData = {
    user_id: user.id,
    client_id: clientId,
    avatar_url: avatarUrl,
    full_name: name, // Começamos com o nome no campo de pessoa física
    person_type: 'cpf' // Default to CPF, can be changed later
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
    const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase error:', error);
        return { data: null, error: { message: 'Não foi possível buscar os clientes.' } };
    }

    return { data, error: null };
}

export async function getClientById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();

    if (error) {
        console.error('Supabase error:', error);
        return { data: null, error: { message: 'Não foi possível buscar os dados do cliente.' } };
    }

    return { data, error: null };
}

export async function updateClientProfile(id: string, formData: ClientFormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } }
  }

  const profileData = {
    person_type: formData.personType,
    company_name: formData.companyName,
    cnpj: formData.cnpj,
    representative_name: formData.representativeName,
    representative_rg: formData.representativeRg,
    representative_cpf: formData.representativeCpf,
    full_name: formData.fullName,
    nationality: formData.nationality,
    civil_status: formData.civilStatus,
    profession: formData.profession,
    rg: formData.rg,
    cpf: formData.cpf,
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
