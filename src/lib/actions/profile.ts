

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProfileFormData } from '@/app/dashboard/settings/profile/page';
import type { PublicProfileData } from '@/app/dashboard/settings/public-profile/page';
import { sendProfileWebhook } from './webhook';
import { sendTransactionalEmail } from '../brevo';
import { getOrCreateAsaasCustomer } from '../asaas';
import { revalidatePath } from 'next/cache';

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
    credits: 0, // Crédito inicial removido, agora é 0
    plan_type: formData.is_agency ? 'squad' : 'free', // Define plano com base na escolha
    is_agency: formData.is_agency,
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


export async function savePublicProfile(formData: PublicProfileData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: { message: 'Usuário não autenticado.' } };
    }

    const { data: existingProfile, error: existingError } = await supabase
        .from('profiles')
        .select('slug')
        .neq('id', user.id)
        .eq('slug', formData.slug)
        .single();
    
    if (existingProfile) {
        return { error: { message: 'Esta URL personalizada já está em uso por outro usuário. Por favor, escolha outra.' } };
    }
     if (existingError && existingError.code !== 'PGRST116') { // Ignore 'not found'
        return { error: { message: `Erro ao verificar URL: ${existingError.message}` } };
    }

    const publicProfileData = {
        avatar_url: formData.avatar_url,
        slug: formData.slug,
        title: formData.title,
        location: formData.location,
        availability: formData.availability,
        responseTime: formData.responseTime,
        bio: formData.bio,
        specialties: formData.specialties,
        services: formData.services,
        tools: formData.tools,
        certifications: formData.certifications,
        testimonials: formData.testimonials,
        public_profile_completed: true,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('profiles')
        .update(publicProfileData)
        .eq('id', user.id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating public profile:', error);
        return { error: { message: `Não foi possível salvar o perfil público: ${error.message}` } };
    }

    revalidatePath('/dashboard/settings/public-profile');
    revalidatePath(`/assistente/${data.slug}`);
    
    return { data, error: null };
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
