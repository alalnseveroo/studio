

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProfileFormData } from '@/app/dashboard/settings/profile/page';
import { sendProfileWebhook } from './webhook';

const AVATAR_USER_MALE = 'https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/AvatarUser/avatar-assist-homem.png';
const AVATAR_USER_FEMALE = 'https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/AvatarUser/avatar-assist-muler.png';


export async function saveProfile(formData: ProfileFormData & { is_completed: boolean }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } }
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
    updated_at: new Date().toISOString(),
    is_completed: formData.is_completed,
    email: user.email, // Incluindo email para o webhook
  };

  const { data, error } = await supabase.from('profiles').upsert(profileData).select().single();

  if (error) {
    console.error('Supabase error:', error)
    return { error: { message: `Não foi possível salvar o perfil: ${error.message}` } }
  }
  
  try {
      if(data) {
          await sendProfileWebhook('update', data);
      }
  } catch (webhookError: any) {
      console.warn(`Falha ao enviar webhook de atualização de perfil: ${webhookError.message}`);
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
