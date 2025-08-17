
'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProfileFormData } from '@/app/dashboard/settings/profile/page';
import { sendProfileWebhook } from './webhook';
import { sendTransactionalEmail } from '../brevo';
import { getOrCreateAsaasCustomer } from '../asaas';

const AVATAR_USER_MALE = 'https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/AvatarUser/avatar-assist-homem.png';
const AVATAR_USER_FEMALE = 'https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/AvatarUser/avatar-assist-muler.png';


export async function saveProfile(formData: ProfileFormData & { is_completed: boolean }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } }
  }

  // 1. Criar ou obter o cliente no Asaas ANTES de salvar no nosso banco
  let asaasCustomerId: string | null = null;
  try {
      const profileWithEmail = { ...formData, email: user.email };
      const asaasCustomer = await getOrCreateAsaasCustomer(profileWithEmail);
      if (asaasCustomer && asaasCustomer.id) {
        asaasCustomerId = asaasCustomer.id; // Extrai apenas o ID (string)
      } else {
        throw new Error('O objeto de cliente retornado pelo Asaas é inválido ou não contém um ID.');
      }
  } catch (asaasError: any) {
      console.error("Asaas customer creation failed:", asaasError.message);
      return { error: { message: `Falha ao sincronizar com o sistema de pagamentos: ${asaasError.message}` } };
  }

  if (!asaasCustomerId) {
       return { error: { message: 'Não foi possível obter um ID de cliente do sistema de pagamentos.' } };
  }


  const avatarUrl = formData.sex === 'male' ? AVATAR_USER_MALE : AVATAR_USER_FEMALE;

  const profileData = {
    id: user.id,
    person_type: formData.personType,
    company_name: formData.companyName,
    cnpj: formData.cnpj,
    full_name: formData.fullName,
    nationality: formData.nationality,
    cpf: formData.cpf,
    address: formData.address,
    signature: formData.signature,
    sex: formData.sex,
    avatar_url: avatarUrl,
    phone: formData.phone,
    updated_at: new Date().toISOString(),
    is_completed: formData.is_completed,
    email: user.email, // Incluindo email para o webhook
    asaas_customer_id: asaasCustomerId, // 2. Salvar a STRING do ID do Asaas
  };

  const { data, error } = await supabase.from('profiles').upsert(profileData).select().single();

  if (error) {
    console.error('Supabase error:', error)
    return { error: { message: `Não foi possível salvar o perfil: ${error.message}` } }
  }
  
    if(data) {
      try {
          await sendProfileWebhook('update', data);
      } catch (webhookError: any) {
          console.warn(`Falha ao enviar webhook de atualização de perfil: ${webhookError.message}`);
      }

      // Agendar e-mail após 1 minuto
      setTimeout(async () => {
        try {
          await sendTransactionalEmail({
            toEmail: user.email!,
            templateId: 65,
            params: {
              CONTRATADA_NOME: data.full_name || data.company_name
            },
            userId: user.id
          })
        } catch (emailError: any) {
          console.error('Falha ao enviar e-mail agendado de perfil completo:', emailError.message);
        }
      }, 60000); // 1 minuto
  }

  return { data, error: null }
}


export async function getProfile(userId?: string) {
    const supabase = createClient();
    let targetUserId = userId;
    let email: string | undefined;

    const { data: { user } } = await supabase.auth.getUser();

    if (userId) {
        targetUserId = userId;
    } else if (user) {
        targetUserId = user.id;
        email = user.email;
    }

    if (!targetUserId) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
    }

    const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
        
    // Se houver um erro e não for o de 'nenhum resultado encontrado', retorne o erro.
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return { data: null, error: { message: 'Erro ao buscar perfil.' } };
    }

    // Se não houver dados de perfil (usuário novo), retorne nulo.
    if (!profileData) {
        return { data: null, error: null };
    }
    
    // Se o perfil foi encontrado, adicione o e-mail do usuário autenticado a ele.
    if (!profileData.email && user && user.id === targetUserId) {
        profileData.email = user.email;
    }

    return { data: profileData, error: null };
}
