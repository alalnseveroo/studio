

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getContractTemplate } from '@/lib/contract-template'
import type { Profile, Contrato, SignatureData } from '@/lib/types'
import { sendTransactionalEmail } from '../brevo'
import { format } from 'date-fns'

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
            clientes (id, full_name, company_name, avatar_url, email),
            propostas (id, name, value, payment_day)
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

    // Adiciona a busca por cobranças separadamente se o contrato for encontrado
    if (data) {
        const { data: charges, error: chargesError } = await supabase
            .from('cobrancas')
            .select('*')
            .eq('cliente_id', data.cliente_id);

        if (chargesError) {
             console.error('Supabase error fetching charges for contract:', chargesError);
        } else {
            // Anexa as cobranças ao objeto do cliente dentro do contrato
            if (data.clientes) {
                (data.clientes as any).Cobranca = charges || [];
            }
        }
    }


    return { data, error: null };
}


export async function getContractsForClientPortal(clientId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('contratos')
        .select('*, propostas(*)')
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

    const { error: otpError } = await supabase.auth.verifyOtp({
        email: user.email,
        token: otp,
        type: 'email'
    });
    
    if (otpError) {
        return { data: null, error: { message: `Código OTP inválido ou expirado. ${otpError.message}` } };
    }
    
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

    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || 'IP não detectado';
    const userAgent = headersList.get('user-agent') || 'User agent não detectado';

    const signatureMetadata = {
        signed_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        email_verified: user.email,
    };

    const updatedContractData = { 
        ...contract, 
        provider_signature_data: signatureMetadata,
        provider_signature_image_url: contratada.signature
    };

    const finalContractText = getContractTemplate({
        contratada,
        contratante: contract.clientes,
        proposta: contract.propostas,
        contract: updatedContractData as Contrato,
    });

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

    if (contract.clientes?.email) {
        try {
            const portalUrl = new URL(`/portal/${contract.cliente_id}/contrato/${contract.id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();
            await sendTransactionalEmail({
                toEmail: contract.clientes.email,
                templateId: 58, 
                params: {
                    CONTRATADA_NOME: contratada.full_name || contratada.company_name,
                    CLIENTE_NOME: contract.clientes.full_name || contract.clientes.company_name,
                    LINK_PORTAL: portalUrl,
                },
                userId: user.id
            });
        } catch (emailError: any) {
            console.warn(`Falha ao enviar e-mail de notificação de assinatura: ${emailError.message}`);
        }
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
    
    // Busca a versão mais recente do contrato ANTES de qualquer verificação
    const { data: contract, error: contractError } = await supabase
        .from('contratos')
        .select('*, clientes(*), propostas(*)')
        .eq('id', contractId)
        .single();

    if (contractError || !contract || !contract.clientes?.email) {
        return { data: null, error: { message: 'Contrato ou e-mail do cliente não encontrado.' } };
    }
    
    if (!contract.client_signature_otp || !contract.client_signature_otp_expires_at) {
        return { data: null, error: { message: 'Nenhum código de verificação foi gerado para este contrato.' } };
    }

    if (new Date() > new Date(contract.client_signature_otp_expires_at)) {
        return { data: null, error: { message: 'O código de verificação expirou. Por favor, solicite um novo.' } };
    }
    
    if (contract.client_signature_otp !== otp) {
        return { data: null, error: { message: 'O código de verificação está incorreto.' } };
    }

    const { data: contratada, error: providerError } = await getProviderProfile(supabase, contract.user_id);
    if (providerError || !contratada) {
         return { data: null, error: { message: 'Perfil da contratada não encontrado.' } };
    }

    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || 'IP não detectado';
    const userAgent = headersList.get('user-agent') || 'User agent não detectado';

    const clientSignatureMetadata = {
        signed_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        email_verified: contract.clientes.email,
    };
    
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

    const { data: updatedContract, error: updateError } = await supabase
        .from('contratos')
        .update({
            status: 'signed_by_client',
            client_signature_data: clientSignatureMetadata,
            client_signature_image_url: signatureDataUrl,
            full_contract_text: finalContractText,
            client_signature_otp: null, // Limpa o código após o uso
            client_signature_otp_expires_at: null, // Limpa a data de expiração
        })
        .eq('id', contractId)
        .select('*, clientes(*), propostas(*)')
        .single();

    if (updateError) {
         return { data: null, error: { message: `Não foi possível assinar o contrato: ${updateError.message}` } };
    }

    // Cria a cobrança da primeira parcela após a assinatura
    if (updatedContract && updatedContract.propostas?.value) {
        const { error: chargeError } = await supabase.from('cobrancas').insert({
            user_id: updatedContract.user_id,
            cliente_id: updatedContract.cliente_id,
            due_date: format(new Date(), 'yyyy-MM-dd'),
            value: updatedContract.propostas.value,
            status: 'pendente'
        });

        if (chargeError) {
            // Log do erro, mas não impede a resposta de sucesso da assinatura
            console.error(`Falha ao criar cobrança para o contrato ${updatedContract.id}: ${chargeError.message}`);
        }
    }


    revalidatePath(`/dashboard/contratos/${contractId}`);
    revalidatePath(`/dashboard/cobrancas`);
    revalidatePath(`/dashboard/clientes/${contract.cliente_id}`);
    revalidatePath(`/portal/${contract.cliente_id}/contrato/${contract.id}`);
    revalidatePath(`/portal/${contract.cliente_id}`);
    return { data: updatedContract, error: null };
}

export async function deleteMultipleContracts(ids: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } };
  }

  const { error } = await supabase
    .from('contratos')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id);

  if (error) {
    console.error('Supabase bulk delete error (contracts):', error);
    return { error: { message: `Não foi possível excluir os contratos selecionados: ${error.message}` } };
  }

  revalidatePath('/dashboard/contratos');
  return { error: null };
}

    
