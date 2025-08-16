

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
  };

  const { data: savedProfile, error } = await supabase.from('profiles').upsert(profileData).select().single();

  if (error) {
    console.error('Supabase error:', error)
    return { error: { message: `Não foi possível salvar o perfil: ${error.message}` } }
  }
  
  // Após salvar o perfil, cria o cliente no Asaas para o próprio usuário/empresa
  if (savedProfile) {
    // A função `getOrCreateAsaasCustomer` espera um tipo `Cliente`, mas podemos adaptar
    // o `Profile` para se parecer com um cliente para essa chamada.
    const profileAsClientData = {
        id: savedProfile.id,
        user_id: savedProfile.id,
        full_name: savedProfile.full_name,
        company_name: savedProfile.company_name,
        email: savedProfile.email,
        cpf: savedProfile.cpf,
        cnpj: savedProfile.cnpj,
        address: savedProfile.address,
        // Preencha outros campos necessários se a função `getOrCreateAsaasCustomer` exigir
    };
    
    // @ts-ignore
    const { asaas_customer_id, error: asaasError } = await getOrCreateAsaasCustomer(profileAsClientData, user.id);

    if (asaasError) {
        console.error(`Falha ao criar/buscar o usuário no Asaas: ${asaasError.message}`);
        // Considerar como lidar com este erro. Por enquanto, apenas logamos.
    } else if (asaas_customer_id) {
        // Salva o ID do cliente Asaas no perfil do usuário no Supabase
        const { error: updateAsaasIdError } = await supabase
            .from('profiles')
            .update({ asaas_customer_id: asaas_customer_id })
            .eq('id', user.id);
            
        if (updateAsaasIdError) {
            console.error("Falha ao salvar asaas_customer_id no perfil do usuário:", updateAsaasIdError);
        }
    }
  }
    if(savedProfile) {
      try {
          await sendProfileWebhook('update', savedProfile);
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
              CONTRATADA_NOME: savedProfile.full_name || savedProfile.company_name
            },
            userId: user.id
          })
        } catch (emailError: any) {
          console.error('Falha ao enviar e-mail agendado de perfil completo:', emailError.message);
        }
      }, 60000); // 1 minuto
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
