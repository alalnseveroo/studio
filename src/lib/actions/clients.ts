
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Cliente, Profile, Proposta } from '@/lib/types';
import { format, addMonths } from 'date-fns'
import { sendClientWebhook } from './webhook';
import { sendTransactionalEmail } from '../brevo';
import { createAsaasCharge, getOrCreateAsaasCustomer } from '../asaas';


const AVATARS_CLIENT_MALE = [
    'https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/AvatarClient/client-avatar-3.png',
    'https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/AvatarClient/client-avatar-4.png'
];

const AVATARS_CLIENT_FEMALE = [
    'https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/AvatarClient/client-avatar-1.png',
    'https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/AvatarClient/client-avatar-2.png'
];

export async function createFullClient(formData: any) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado.' } }
  }

  // Buscar o perfil da contratada (usuário) para obter asaas_customer_id
  const { data: providerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*') // Busca o perfil completo
    .eq('id', user.id)
    .single();

  if (profileError || !providerProfile) {
      return { data: null, error: { message: 'Não foi possível buscar os dados da contratada.' } };
  }

  const clientId = `CL#${Math.floor(100000 + Math.random() * 900000)}`;
  
  let avatarUrl = '';
  if (formData.sex === 'male') {
    avatarUrl = AVATARS_CLIENT_MALE[Math.floor(Math.random() * AVATARS_CLIENT_MALE.length)];
  } else {
    avatarUrl = AVATARS_CLIENT_FEMALE[Math.floor(Math.random() * AVATARS_CLIENT_FEMALE.length)];
  }
  
  const clientDataForDb = {
    user_id: user.id,
    client_id: clientId,
    avatar_url: avatarUrl,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    person_type: formData.personType,
    sex: formData.sex,
    full_name: formData.personType === 'cpf' ? formData.fullName : null,
    cpf: formData.personType === 'cpf' ? formData.cpf : null,
    company_name: formData.personType === 'cnpj' ? formData.companyName : null,
    cnpj: formData.personType === 'cnpj' ? formData.cnpj : null,
    representative_name: formData.personType === 'cnpj' ? formData.representativeName : null,
    representative_cpf: formData.personType === 'cnpj' ? formData.representativeCpf : null,
    billing_status: 'inactive' as const,
  };


  const { data: newClient, error } = await supabase.from('clientes').insert(clientDataForDb).select().single()

  if (error) {
    console.error('Supabase error:', error)
    return { data: null, error: { message: `Não foi possível adicionar o cliente: ${error.message}` } }
  }

  // Após criar o cliente no Supabase, cria ou busca no Asaas
  if (newClient) {
     const asaasCustomer = await getOrCreateAsaasCustomer(newClient, user.id);
     if (asaasCustomer.error) {
         // Opcional: deletar o cliente criado no Supabase ou apenas logar o erro
         console.error(`Falha ao criar cliente no Asaas para o cliente Supabase ID ${newClient.id}: ${asaasCustomer.error.message}`);
         // Por simplicidade, vamos apenas logar e continuar. O cliente pode ser sincronizado depois.
     }
  }
  
    if (newClient && newClient.email) {
        try {
            const portalUrl = new URL(`/portal/${newClient.id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();
            const providerName = providerProfile.full_name || providerProfile.company_name;

            await sendTransactionalEmail({
                toEmail: newClient.email,
                templateId: 62,
                params: { 
                    CLIENTE_NOME: newClient.full_name || newClient.company_name,
                    CONTRATADA_NOME: providerName,
                    LINK_PORTAL: portalUrl,
                },
                userId: user.id
            });

        } catch (emailError: any) {
            console.warn(`Falha ao enviar e-mail de boas-vindas: ${emailError.message}`);
        }
    }

  revalidatePath('/dashboard/clientes')
  return { data: newClient, error: null }
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
    value: number;
    payment_day: number;
    first_charge_date?: string | null;
    send_charge_now?: boolean;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } };
  }
  
  const { data: client, error: clientError } = await getClientById(id);
  if (clientError || !client) {
    return { error: { message: 'Cliente não encontrado.' } };
  }

  const { data: providerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profileError || !providerProfile) {
    return { error: { message: 'Perfil da contratada não encontrado.' } };
  }
  
  const { asaas_customer_id, error: asaasError } = await getOrCreateAsaasCustomer(client, user.id);
  if (asaasError) {
      return { error: { message: `Erro ao integrar com Asaas: ${asaasError.message}` } };
  }

  if (asaas_customer_id && client.asaas_customer_id !== asaas_customer_id) {
    await supabase.from('clientes').update({ asaas_customer_id }).eq('id', client.id);
  }

  // Lógica de cobrança imediata
  if (financials.send_charge_now) {
    const chargeValue = Number(financials.value);
    const dueDate = new Date();
    
    const { payment, error: asaasChargeError } = await createAsaasCharge({
        customer: asaas_customer_id,
        value: chargeValue,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        description: `Cobrança de serviços - ${providerProfile.full_name || providerProfile.company_name}`
    });

    if (asaasChargeError) {
      return { error: { message: `Configurações salvas, mas não foi possível gerar a cobrança no Asaas: ${asaasChargeError.message}`}};
    }

    const { error: chargeError } = await supabase.from('cobrancas').insert({
      user_id: user.id,
      cliente_id: id,
      due_date: format(dueDate, 'yyyy-MM-dd'),
      value: chargeValue,
      status: 'pendente',
      asaas_payment_id: payment.id
    });

    if (chargeError) {
      return { error: { message: `Cobrança gerada no Asaas, mas não foi possível salvar no sistema: ${chargeError.message}`}};
    }
  }

  // Define a data da próxima cobrança recorrente
  let nextChargeDate = financials.first_charge_date;
  if (financials.send_charge_now) {
    const today = new Date();
    const nextMonthDate = addMonths(today, 1);
    nextChargeDate = format(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), Number(financials.payment_day)), 'yyyy-MM-dd');
  }

  const financialUpdateData = {
    billing_status: financials.billing_status,
    proposal_id: financials.proposal_id,
    value: financials.value ? Number(financials.value) : null,
    payment_day: financials.payment_day ? Number(financials.payment_day) : null,
    first_charge_date: nextChargeDate || null,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedClient, error } = await supabase
    .from('clientes')
    .update(financialUpdateData)
    .eq('id', id)
    .select('*, propostas(*)')
    .single();

  if (error) {
    console.error('Supabase error updating financials:', error);
    return { error: { message: `Não foi possível atualizar as configurações financeiras: ${error.message}` } };
  }
  
  try {
    if (updatedClient) {
        const portalUrl = new URL(`/portal/${updatedClient.id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();
        const providerName = providerProfile.full_name || providerProfile.company_name;

        const dataWithContext = { 
            ...updatedClient,
            portal_url: portalUrl,
            provider_name: providerName,
            proposta: updatedClient.propostas 
        };
        await sendClientWebhook('update', dataWithContext);
    }
  } catch (webhookError: any) {
    console.warn(`Falha ao enviar webhook de atualização financeira: ${webhookError.message}`);
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
