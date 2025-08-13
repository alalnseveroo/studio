
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Cliente } from '@/lib/types';
import { format } from 'date-fns';
import { sendClientWebhook } from './webhook';
import { addOrUpdateContact } from '../brevo';

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

  // Buscar o perfil da contratada (usuário)
  const { data: providerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, company_name')
    .eq('id', user.id)
    .single();

  if (profileError) {
      return { data: null, error: { message: 'Não foi possível buscar os dados da contratada.' } };
  }

  const clientId = `CL#${Math.floor(100000 + Math.random() * 900000)}`;
  const avatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];
  
  const clientData = {
    user_id: user.id,
    client_id: clientId,
    avatar_url: avatarUrl,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    person_type: formData.personType,
    full_name: formData.personType === 'cpf' ? formData.fullName : null,
    cpf: formData.personType === 'cpf' ? formData.cpf : null,
    company_name: formData.personType === 'cnpj' ? formData.companyName : null,
    cnpj: formData.personType === 'cnpj' ? formData.cnpj : null,
    representative_name: formData.personType === 'cnpj' ? formData.representativeName : null,
    representative_cpf: formData.personType === 'cnpj' ? formData.representativeCpf : null,
    billing_status: 'inactive' as const, 
  };


  const { data, error } = await supabase.from('clientes').insert(clientData).select().single()

  if (error) {
    console.error('Supabase error:', error)
    return { data: null, error: { message: `Não foi possível adicionar o cliente: ${error.message}` } }
  }
  
  try {
    if (data) {
        const portalUrl = new URL(`/portal/${data.id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();
        const providerName = providerProfile.full_name || providerProfile.company_name;

        // Enriquecer os dados com a URL do portal e o nome da contratada
        const dataWithContext = { 
            ...data, 
            portal_url: portalUrl,
            provider_name: providerName 
        };

        await sendClientWebhook('create', dataWithContext);
    }
  } catch (webhookError: any) {
    console.warn(`Falha ao enviar webhook de criação de cliente: ${webhookError.message}`);
  }

  revalidatePath('/dashboard/clientes')
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

  const { data: updatedData, error } = await supabase.from('clientes').update(profileData).eq('id', id).select().single();

  if (error) {
    console.error('Supabase error:', error)
    return { error: { message: `Não foi possível salvar o perfil do cliente: ${error.message}` } }
  }
  
   try {
    if (updatedData) {
        const portalUrl = new URL(`/portal/${updatedData.id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();
        const dataWithPortalUrl = { ...updatedData, portal_url: portalUrl };
        await sendClientWebhook('update', dataWithPortalUrl);
    }
  } catch (webhookError: any) {
    console.warn(`Falha ao enviar webhook de atualização de cliente: ${webhookError.message}`);
  }

  revalidatePath('/dashboard/clientes')
  revalidatePath(`/dashboard/clientes/${id}`)
  return { error: null }
}


export async function updateClientFinancials(id: string, financials: { 
    billing_status: 'active' | 'inactive'; 
    proposal_id: string | null; 
    value: string | null,
    payment_day: string | null,
    first_charge_date?: string | null,
    send_charge_now?: boolean,
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } };
  }
  
  const parsedValue = financials.value ? parseFloat(financials.value) : null;
  if (financials.value && isNaN(parsedValue)) {
      return { error: { message: 'O valor fornecido não é um número válido.' } };
  }

  const parsedPaymentDay = financials.payment_day ? parseInt(financials.payment_day, 10) : null;
   if (financials.payment_day && isNaN(parsedPaymentDay)) {
      return { error: { message: 'O dia de pagamento fornecido não é um número válido.' } };
  }

  const { error } = await supabase
    .from('clientes')
    .update({
      billing_status: financials.billing_status,
      proposal_id: financials.proposal_id,
      value: parsedValue,
      payment_day: parsedPaymentDay,
      first_charge_date: financials.first_charge_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Supabase error updating financials:', error);
    return { error: { message: `Não foi possível atualizar as configurações financeiras: ${error.message}` } };
  }
  
  if (financials.send_charge_now && parsedValue) {
      const { error: chargeError } = await supabase.from('cobrancas').insert({
          user_id: user.id,
          cliente_id: id,
          due_date: new Date().toISOString().split('T')[0], // Hoje
          value: parsedValue,
          status: 'pendente',
      });
      if (chargeError) {
          console.error('Supabase error creating immediate charge:', chargeError);
          return { error: { message: `Configurações salvas, mas não foi possível gerar a cobrança imediata: ${chargeError.message}`}};
      }
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

export async function deleteMultipleClients(ids: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } };
  }

  const { error } = await supabase
    .from('clientes')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id);

  if (error) {
    console.error('Supabase bulk delete error:', error);
     if (error.code === '23503') { // Foreign key violation
        return { error: { message: 'Não é possível excluir um ou mais clientes selecionados, pois estão associados a contratos ou cobranças existentes.' } };
    }
    return { error: { message: `Não foi possível excluir os clientes selecionados: ${error.message}` } };
  }

  revalidatePath('/dashboard/clientes');
  return { error: null };
}
