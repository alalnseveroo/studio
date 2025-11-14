
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendTransactionalEmail } from '../brevo'

export async function getTeamMembers() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: [], error: { message: 'Usuário não autenticado.' } };
    }

    // Busca os membros da equipe associados à agência do usuário logado
    const { data, error } = await supabase
        .from('team_members')
        .select(`
            id,
            role,
            profiles:user_id (
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .eq('agency_id', user.id);

    if (error) {
        console.error('Error fetching team members:', error);
        return { data: [], error: { message: 'Não foi possível buscar os membros da equipe.' } };
    }

    return { data, error: null };
}

export async function inviteTeamMember(email: string, password: string) {
    const supabase = createClient();
    const { data: { user: agencyOwner } } = await supabase.auth.getUser();

    if (!agencyOwner) {
        return { error: { message: 'Usuário não autenticado.' } };
    }
    
    const { data: agencyProfile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', agencyOwner.id)
        .single();
    
    if (profileError || !agencyProfile) {
        return { error: { message: 'Não foi possível encontrar o perfil da agência.' } };
    }

    // Usa o cliente admin para criar o usuário, pois isso não requer confirmação por e-mail
    const supabaseAdmin = createAdminClient();

    // 1. Cria o novo usuário no Supabase Auth
    const { data: newUser, error: creationError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Marca o e-mail como confirmado
    });
    
    if (creationError) {
        console.error('Error creating team member user:', creationError);
        // Personaliza a mensagem de erro para o usuário
        if (creationError.message.includes('unique constraint')) {
            return { error: { message: 'Este e-mail já está cadastrado no sistema.' } };
        }
        return { error: { message: `Não foi possível criar o usuário: ${creationError.message}` } };
    }

    if (!newUser || !newUser.user) {
         return { error: { message: 'Falha ao receber dados do novo usuário.' } };
    }

    // 2. Cria um perfil básico para o novo usuário
    const { error: newProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: newUser.user.id,
            email: email,
            full_name: email, // Usa o e-mail como nome temporário
            is_completed: false, // O novo membro precisará completar seu perfil
            plan_type: 'Squad',
            credits: 0,
        });

    if (newProfileError) {
        console.error('Error creating profile for team member:', newProfileError);
        // Tenta deletar o usuário criado para reverter a operação
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return { error: { message: 'Não foi possível criar o perfil para o novo membro.' } };
    }

    // 3. Adiciona o novo usuário à tabela team_members
    const { error: teamError } = await supabaseAdmin
        .from('team_members')
        .insert({
            agency_id: agencyOwner.id,
            user_id: newUser.user.id,
            role: 'member', // Papel padrão, pode ser expandido no futuro
        });

    if (teamError) {
        console.error('Error adding user to team_members:', teamError);
        // Tenta deletar o usuário e o perfil criados
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return { error: { message: 'Não foi possível adicionar o membro à equipe.' } };
    }
    
    // 4. Envia e-mail de boas-vindas
    try {
        await sendTransactionalEmail({
            toEmail: email,
            templateId: 63, // ID do template "Bem-vindo à Equipe"
            params: {
                AGENCY_NAME: agencyProfile.company_name || agencyProfile.full_name,
                LOGIN_EMAIL: email,
                LOGIN_PASSWORD: password, // ATENÇÃO: Enviar senhas por e-mail não é o ideal.
                LINK_ACESSO: process.env.NEXT_PUBLIC_SITE_URL || 'https://app.crivo.pro',
            },
            userId: agencyOwner.id
        });
    } catch (emailError: any) {
        // Opcional: não reverte a criação se o e-mail falhar, apenas avisa.
        console.warn(`Membro ${email} criado, mas o e-mail de boas-vindas falhou: ${emailError.message}`);
    }

    return { error: null };
}
