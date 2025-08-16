

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Cliente, Profile, Proposta } from '@/lib/types';
import { format } from 'date-fns'
import { sendClientWebhook } from './webhook';
import { addOrUpdateContact, sendTransactionalEmail } from '../brevo';
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

  // Buscar o perfil da contratada (usuário)
  const { data: providerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, company_name')
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
  
  const clientData = {
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


  const { data, error } = await supabase.from('clientes').insert(clientData).select().single()

  if (error) {
    console.error('Supabase error:', error)
    return { data: null, error: { message: `Não foi possível adicionar o cliente: ${error.message}` } }
  }
  
    if (data && data.email) {
        try {
            const portalUrl = new URL(`/portal/${data.id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();
            const providerName = providerProfile.full_name || providerProfile.company_name;

            // Enriquecer os dados com a URL do portal e o nome da contratada
            const dataWithContext = { 
                ...data, 
                portal_url: portalUrl,
                provider_name: providerName 
            };

            await sendClientWebhook('create', dataWithContext);

            // Agendar e-mail após 2 minutos
            setTimeout(async () => {
                try {
                    await sendTransactionalEmail({
                        toEmail: data.email!,
                        templateId: 62,
                        params: { 
                            CLIENTE_NOME: data.full_name || data.company_name,
                            CONTRATADA_NOME: providerName,
                         },
                        userId: user.id
                    });
                } catch (emailError: any) {
                    console.error('Falha ao enviar e-mail agendado de criação de cliente:', emailError.message);
                }
            }, 120000); // 2 minutos

        } catch (webhookError: any) {
            console.warn(`Falha ao enviar webhook de criação de cliente: ${webhookError.message}`);
        }
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

  const { data: client, error: clientError } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

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
    const { error: updateAsaasIdError } = await supabase
        .from('clientes')
        .update({ asaas_customer_id })
        .eq('id', client.id);
    if (updateAsaasIdError) console.error("Failed to save Asaas customer ID", updateAsaasIdError);
  }


  const financialUpdateData = {
      billing_status: financials.billing_status,
      proposal_id: financials.proposal_id,
      value: parsedValue,
      payment_day: parsedPaymentDay,
      first_charge_date: financials.first_charge_date || null,
      updated_at: new Date().toISOString(),
    };

  const { data: updatedClient, error } = await supabase
    .from('clientes')
    .update(financialUpdateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, propostas(*)')
    .single();

  if (error) {
    console.error('Supabase error updating financials:', error);
    return { error: { message: `Não foi possível atualizar as configurações financeiras: ${error.message}` } };
  }
  
  // Enviar webhook com dados atualizados
   try {
    if (updatedClient) {
        const portalUrl = new URL(`/portal/${updatedClient.id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();
        const providerName = providerProfile.full_name || providerProfile.company_name;

        const dataWithContext = { 
            ...updatedClient,
            portal_url: portalUrl,
            provider_name: providerName,
            // Adiciona a proposta completa se existir
            proposta: updatedClient.propostas 
        };
        await sendClientWebhook('update', dataWithContext);
    }
  } catch (webhookError: any) {
    console.warn(`Falha ao enviar webhook de atualização financeira: ${webhookError.message}`);
  }

  
  if (financials.send_charge_now && parsedValue && asaas_customer_id) {
      const dueDate = new Date();
      
       const { payment, error: asaasChargeError } = await createAsaasCharge({
            customer: asaas_customer_id,
            value: parsedValue,
            dueDate: format(dueDate, 'yyyy-MM-dd'),
            description: `Cobrança de serviços - ${providerProfile.full_name || providerProfile.company_name}`
        });

        if (asaasChargeError) {
             return { error: { message: `Configurações salvas, mas não foi possível gerar a cobrança no Asaas: ${asaasChargeError.message}`}};
        }

      const { data: chargeData, error: chargeError } = await supabase.from('cobrancas').insert({
          user_id: user.id,
          cliente_id: id,
          due_date: dueDate.toISOString().split('T')[0],
          value: parsedValue,
          status: 'pendente',
          asaas_payment_id: payment.id
      }).select().single();

      if (chargeError) {
          console.error('Supabase error creating immediate charge:', chargeError);
          return { error: { message: `Cobrança gerada no Asaas, mas não foi possível salvar no sistema: ${chargeError.message}`}};
      }
      
      // Enviar e-mail de cobrança imediata
      const portalUrl = new URL(`/portal/${id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();
      try {
          await sendTransactionalEmail({
              toEmail: client.email!,
              templateId: 63, // Lembrete Manual / Cobrança imediata
              params: {
                  CLIENTE_NOME: client.full_name || client.company_name,
                  CONTRATADA_NOME: providerProfile.full_name || providerProfile.company_name,
                  COBRANCA_VALOR: parsedValue.toFixed(2),
                  COBRANCA_VENCIMENTO: format(dueDate, 'dd/MM/yyyy'),
                  LINK_PORTAL: portalUrl,
              },
              userId: user.id,
          });
      } catch (emailError: any) {
         console.error('Falha ao enviar e-mail de cobrança imediata:', emailError.message);
         // Não retorna erro, apenas loga. A cobrança foi criada com sucesso.
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
