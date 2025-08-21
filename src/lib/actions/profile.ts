
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

  const avatarUrl = formData.sex === 'male' ? AVATAR_USER_MALE : AVATAR_USER_FEMALE;
  
  // O perfil do usuário logado é o "cliente" na Asaas.
  const profileForAsaas = {
    id: user.id,
    email: user.email,
    cpf: formData.cpf,
    cnpj: formData.cnpj,
    full_name: formData.fullName,
    company_name: formData.companyName,
    phone: formData.phone,
    address: formData.address,
    is_completed: formData.is_completed, // para diferenciar de um cliente normal
  };

  const asaasCustomer = await getOrCreateAsaasCustomer(profileForAsaas);

  if (!asaasCustomer || !asaasCustomer.id) {
     return { error: { message: 'Não foi possível obter um ID de cliente do sistema de pagamentos.' } };
  }

  const profileData = {
    id: user.id,
    person_type: formData.personType,
    company_name: formData.companyName,
    cnpj: formData.cnpj,
    full_name: formData.fullName,
    nationality: formData.nationality,
    cpf: formData.cpf,
    phone: formData.phone,
    address: formData.address,
    signature: formData.signature,
    sex: formData.sex,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
    is_completed: formData.is_completed,
    email: user.email, 
    asaas_customer_id: asaasCustomer.id,
    pix_key: formData.pix_key,
    credits: 1, 
    plan_type: 'per_client', 
  };

  const { data: savedProfile, error } = await supabase.from('profiles').upsert(profileData).select().single();

  if (error) {
    console.error('Supabase error:', error)
    return { error: { message: `Não foi possível salvar o perfil: ${error.message}` } }
  }
  
    if(savedProfile && formData.is_completed) {
      try {
          await sendTransactionalEmail({
            toEmail: user.email!,
            templateId: 65, 
            params: {
              CONTRATADA_NOME: savedProfile.full_name || savedProfile.company_name
            },
            userId: user.id
          });
      } catch (emailError: any) {
          console.error('Falha ao enviar e-mail de perfil completo:', emailError.message);
      }
  }

  return { error: null }
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
        
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return { data: null, error: { message: 'Erro ao buscar perfil.' } };
    }

    if (!profileData) {
        return { data: null, error: null };
    }
    
    if (!profileData.email && user && user.id === targetUserId) {
        profileData.email = user.email;
    }

    return { data: profileData, error: null };
}
