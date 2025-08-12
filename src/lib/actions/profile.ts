
'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProfileFormData } from '@/app/dashboard/settings/profile/page';
import { supabaseAdmin } from '../supabase/admin';

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

    if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { data: null, error: { message: 'Usuário não autenticado' } };
        }
        targetUserId = user.id;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'exact-one' error for new users
        console.error('Error fetching profile:', error);
        return { data: null, error: { message: 'Erro ao buscar perfil.' } };
    }
    
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    
    if (authErr) {
        console.error('Error fetching auth user:', authErr);
        return { data: null, error: { message: 'Erro ao buscar e-mail do usuário.' } };
    }
    
    const email = authUser?.user?.email;

    // Combine profile data with user email
    const profileWithEmail = data ? { ...data, email } : { id: targetUserId, email };

    return { data: profileWithEmail, error: null };
}
