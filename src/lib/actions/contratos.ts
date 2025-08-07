'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getContractTemplate } from '@/lib/contract-template'
import type { Profile, Contrato } from '@/lib/types'

// Helper para buscar o perfil da contratada (usuário logado)
async function getProviderProfile(supabase: any, userId: string): Promise<{ data: Profile | null, error: any }> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
}

export async function createContract(clienteId: string, propostaId: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { message: 'Usuário não autenticado.' } }
  }

  // 1. Buscar os dados completos do cliente, da proposta e do perfil da contratada
  const [
    { data: cliente, error: clienteError }, 
    { data: proposta, error: propostaError },
    { data: contratada, error: contratadaError }
  ] = await Promise.all([
     supabase.from('clientes').select('*').eq('id', clienteId).single(),
     supabase.from('propostas').select('*').eq('id', propostaId).single(),
     getProviderProfile(supabase, user.id)
  ]);

  if (clienteError || propostaError || contratadaError) {
      const errorMsg = clienteError?.message || propostaError?.message || contratadaError?.message;
      return { data: null, error: { message: `Não foi possível buscar os dados para gerar o contrato. Detalhes: ${errorMsg}` } };
  }

  if (!contratada) {
    return { data: null, error: { message: 'Perfil da contratada não encontrado. Por favor, preencha seu perfil nas configurações.' } };
  }
  
  if (!contratada.signature) {
    return { data: null, error: { message: 'Perfil incompleto. Por favor, preencha sua assinatura nas configurações antes de gerar um contrato.' } };
  }

  // 2. Gerar o texto completo do contrato
  const fullContractText = getContractTemplate({ contratada, contratante: cliente, proposta, contract: null });
  
  // 3. Gerar código único do contrato
  const contractCode = `CT#${Math.floor(100000 + Math.random() * 900000)}`;

  // 4. Inserir o novo contrato no banco
  const { data: newContract, error: insertError } = await supabase
    .from('contratos')
    .insert({
      user_id: user.id,
      cliente_id: clienteId,
      proposta_id: propostaId,
      contract_code: contractCode,
      status: 'draft',
      full_contract_text: fullContractText
    })
    .select(`
        *,
        clientes(*),
        propostas(*)
    `)
    .single()

  if (insertError) {
    console.error('Supabase insert error:', insertError)
    return { data: null, error: { message: `Não foi possível criar o contrato: ${insertError.message}` } }
  }
  
  revalidatePath('/dashboard/contratos')
  return { data: newContract, error: null }
}


export async function getContracts() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: 'Usuário não autenticado.' } };

    const { data, error } = await supabase
        .from('contratos')
        .select(`
            *,
            clientes (id, full_name, company_name),
            propostas (id, name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase error:', error);
        return { data: null, error: { message: 'Não foi possível buscar os contratos.' } };
    }

    return { data, error: null };
}

export async function getContractById(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: 'Usuário não autenticado.' } };

    const { data, error } = await supabase
        .from('contratos')
        .select(`
            *,
            clientes (*),
            propostas (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
    
    if (error) {
        console.error('Supabase error:', error);
        return { data: null, error: { message: 'Não foi possível buscar o contrato.' } };
    }

    return { data, error: null };
}

export async function getContractForClientById(contractId: string) {
    const supabase = createClient()
    // Esta função é para o portal público, então não há verificação de usuário.
    // A segurança é garantida pelas RLS.
    const { data, error } = await supabase
        .from('contratos')
        .select(`
            *,
            clientes (*),
            propostas (*)
        `)
        .eq('id', contractId)
        .single();
    
    if (error) {
        console.error('Supabase error:', error);
        return { data: null, error: { message: 'Não foi possível buscar os dados do contrato.' } };
    }

    return { data, error: null };
}


export async function getContractsForClientPortal(clientId: string) {
    const supabase = createClient()
    // Esta função é para o portal público.
    const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase error:', error);
        return { data: null, error: { message: 'Não foi possível buscar os contratos do cliente.' } };
    }

    return { data, error: null };
}


export async function signContractAsProvider(contractId: string, otp: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return { data: null, error: { message: 'Usuário não autenticado.' } };

    // Etapa 0: Verificar o OTP
    const { error: otpError } = await supabase.auth.verifyOtp({
        email: user.email,
        token: otp,
        type: 'email'
    });
    
    if (otpError) {
        return { data: null, error: { message: `Código OTP inválido ou expirado. ${otpError.message}` } };
    }
    
    // 1. Buscar o contrato, o perfil e a proposta para gerar o texto final
    const { data: contract, error: contractError } = await supabase
        .from('contratos')
        .select('*, clientes(*), propostas(*)')
        .eq('id', contractId)
        .single();

    if (contractError || !contract) {
        return { data: null, error: { message: 'Contrato não encontrado.' } };
    }

    const { data: contratada, error: providerError } = await getProviderProfile(supabase, user.id);

    if (providerError || !contratada || !contratada.signature) {
        return { data: null, error: { message: 'Perfil da contratada ou assinatura não encontrados.' } };
    }

    // 2. Coletar os metadados da assinatura
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || 'IP não detectado';
    const userAgent = headersList.get('user-agent') || 'User agent não detectado';

    const signatureMetadata = {
        signed_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        email_verified: user.email,
    };

    // 3. Preparar dados para atualização
    const updatedContractData = { 
        ...contract, 
        provider_signature_data: signatureMetadata,
        provider_signature_image_url: contratada.signature
    };

    // 4. Gerar o novo texto do contrato, agora com a assinatura da contratada
    const finalContractText = getContractTemplate({
        contratada,
        contratante: contract.clientes,
        proposta: contract.propostas,
        contract: updatedContractData as Contrato,
    });

    // 5. Atualizar o contrato no banco de dados
    const { data, error: updateError } = await supabase
        .from('contratos')
        .update({
            status: 'signed_by_provider',
            provider_signature_data: signatureMetadata,
            provider_signature_image_url: contratada.signature,
            full_contract_text: finalContractText
        })
        .eq('id', contractId)
        .eq('user_id', user.id)
        .select()
        .single();

    if (updateError) {
        console.error('Supabase update error:', updateError);
        return { data: null, error: { message: `Não foi possível assinar o contrato: ${updateError.message}` } };
    }

    revalidatePath(`/dashboard/contratos/${contractId}`);
    revalidatePath(`/portal/${contract.cliente_id}/contrato/${contract.id}`);
    revalidatePath(`/portal/${contract.cliente_id}`);
    return { data, error: null };
}

interface SignClientArgs {
    contractId: string;
    otp: string;
    signatureDataUrl: string;
}

export async function signContractAsClient({ contractId, otp, signatureDataUrl }: SignClientArgs) {
    const supabase = createClient();
    
    // 1. Buscar contrato e e-mail do cliente
    const { data: contract, error: contractError } = await supabase
        .from('contratos')
        .select('*, clientes(*), propostas(*)')
        .eq('id', contractId)
        .single();

    if (contractError || !contract || !contract.clientes?.email) {
        return { error: { message: 'Contrato ou e-mail do cliente não encontrado.' } };
    }
    
    // 2. Verificar o OTP. Como o cliente não é um usuário, usamos o tipo 'signup'.
    const { error: otpError } = await supabase.auth.verifyOtp({
        email: contract.clientes.email,
        token: otp,
        type: 'signup' // Alterado para 'signup' que é o tipo enviado.
    });

    if (otpError) {
        return { error: { message: `Código OTP inválido ou expirado. ${otpError.message}` } };
    }
    
    // 3. Buscar perfil da contratada para gerar o texto final
    const { data: contratada, error: providerError } = await getProviderProfile(supabase, contract.user_id);
    if (providerError || !contratada) {
         return { error: { message: 'Perfil da contratada não encontrado.' } };
    }

    // 4. Coletar metadados da assinatura
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || 'IP não detectado';
    const userAgent = headersList.get('user-agent') || 'User agent não detectado';

    const clientSignatureMetadata = {
        signed_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        email_verified: contract.clientes.email,
    };
    
    // 5. Gerar texto final do contrato com ambas as assinaturas
     const finalContractData = { 
        ...contract, 
        client_signature_data: clientSignatureMetadata,
        client_signature_image_url: signatureDataUrl
    };

    const finalContractText = getContractTemplate({
        contratada,
        contratante: contract.clientes,
        proposta: contract.propostas,
        contract: finalContractData as Contrato,
    });

    // 6. Atualizar o contrato no banco
    const { error: updateError } = await supabase
        .from('contratos')
        .update({
            status: 'signed_by_client',
            client_signature_data: clientSignatureMetadata,
            client_signature_image_url: signatureDataUrl,
            full_contract_text: finalContractText
        })
        .eq('id', contractId);

    if (updateError) {
         return { error: { message: `Não foi possível assinar o contrato: ${updateError.message}` } };
    }

    revalidatePath(`/dashboard/contratos/${contractId}`);
    revalidatePath(`/portal/${contract.cliente_id}/contrato/${contract.id}`);
    revalidatePath(`/portal/${contract.cliente_id}`);
    return { error: null };
}
