
'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProfileFormData } from '@/app/dashboard/settings/profile/page';

export async function saveProfile(formData: ProfileFormData & { is_completed: boolean }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } }
  }

  const profileData = {
    id: user.id,
    person_type: formData.personType,
    company_name: formData.companyName,
    cnpj: formData.cnpj,
    full_name: formData.fullName,
    nationality: formData.nationality,
    civil_status: formData.civilStatus,
    profession: formData.profession,
    rg: formData.rg,
    cpf: formData.cpf,
    address: formData.address,
    signature: formData.signature,
    updated_at: new Date().toISOString(),
    is_completed: formData.is_completed,
  };

  const { error } = await supabase.from('profiles').upsert(profileData)

  if (error) {
    console.error('Supabase error:', error)
    return { error: { message: `Não foi possível salvar o perfil: ${error.message}` } }
  }

  return { error: null }
}


export async function getProfile(userId?: string) {
    const supabase = createClient();
    let targetUserId = userId;
    let email: string | undefined;

    const { data: { user } } = await supabase.auth.getUser();

    if (userId) {
        // This case is for when an admin might be fetching another user's profile.
        // For now, we don't have an admin role, so we can't get other users' emails securely on the server
        // without the admin client, which was causing issues.
        // We will assume for now we only fetch the logged-in user's profile.
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

    if (error && error.code !== 'PGRST116') { // Ignore 'exact-one' error for new users
        console.error('Error fetching profile:', error);
        return { data: null, error: { message: 'Erro ao buscar perfil.' } };
    }
    
    // If we're fetching the logged-in user's profile, we already have the email.
    if (!email && user && user.id === targetUserId) {
        email = user.email;
    }

    // Combine profile data with user email
    const profileWithEmail = profileData ? { ...profileData, email } : { id: targetUserId, email };

    return { data: profileWithEmail, error: null };
}
