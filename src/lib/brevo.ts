
'use server';

import * as Brevo from '@getbrevo/brevo';
import { createClient } from './supabase/server';
import { createClient as createEdgeClient } from '@supabase/supabase-js';

// Configuração da API da Brevo
const apiInstance = new Brevo.TransactionalEmailsApi();
const contactsApi = new Brevo.ContactsApi();

const BREVO_API_KEY = process.env.BREVO_API_KEY;

if (BREVO_API_KEY) {
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);
    contactsApi.setApiKey(Brevo.ContactsApiApiKeys.apiKey, BREVO_API_KEY);
} else {
    console.warn("Chave da API da Brevo não encontrada. O envio de e-mails não funcionará.");
}

interface EmailParams {
  toEmail: string;
  templateId: number;
  params: { [key: string]: any };
  userId: string;
}

export async function addOrUpdateContact(email: string, attributes: { [key: string]: any }) {
    if (!BREVO_API_KEY) throw new Error("A chave da API da Brevo não está configurada.");

    try {
        // Tenta encontrar o contato primeiro
        await contactsApi.getContactInfo(email);
        
        // Se encontrou, atualiza
        let updateContact = new Brevo.UpdateContact();
        updateContact.attributes = attributes;
        await contactsApi.updateContact(email, updateContact);

    } catch (error: any) {
        // Se não encontrou (erro 404), cria o contato
        if (error.response?.statusCode === 404) {
            let createContact = new Brevo.CreateContact();
            createContact.email = email;
            createContact.attributes = attributes;
            createContact.updateEnabled = false; // Garante que é uma criação
            await contactsApi.createContact(createContact);
        } else {
            // Se for outro erro, lança a exceção
            console.error("Erro na API da Brevo (addOrUpdateContact):", error.body || error);
            throw new Error(error.body?.message || 'Erro ao sincronizar contato com a Brevo.');
        }
    }
}


/**
 * Envia um e-mail transacional usando um template da Brevo.
 * Pode ser chamado de Server Actions ou Edge Functions.
 * @param toEmail - O e-mail do destinatário.
 * @param templateId - O ID do template transacional na Brevo.
 * @param params - Parâmetros para preencher o template.
 * @param userId - O ID do usuário logado (contratada) para buscar o nome do remetente.
 * @param supabaseClient - Instância opcional do cliente supabase para uso em Edge Functions.
 */
export async function sendTransactionalEmail(
    { toEmail, templateId, params, userId }: EmailParams,
    supabaseClient?: any
) {
    if (!BREVO_API_KEY) throw new Error("A chave da API da Brevo não está configurada.");

    // Usa o cliente fornecido (de Edge) ou cria um novo (de Server)
    const supabase = supabaseClient || createClient();

    let providerName = 'Sua Assistente Virtual'; // Valor padrão

    // O nome da contratada já deve vir nos params, mas buscamos como fallback.
    if (!params.CONTRATADA_NOME) {
        const { data: providerProfile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, company_name')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error("Erro ao buscar perfil da contratada:", profileError);
            // Não lança erro, continua com o nome padrão
        } else {
             providerName = providerProfile?.full_name || providerProfile?.company_name || 'Sua Assistente Virtual';
        }
    } else {
        providerName = params.CONTRATADA_NOME;
    }

    // Garante que o nome da contratada está nos parâmetros.
    const finalParams = { ...params, CONTRATADA_NOME: providerName };

    // Garante que o contato e seus atributos estão atualizados antes de enviar o e-mail
    try {
        await addOrUpdateContact(toEmail, finalParams);
    } catch (contactError: any) {
        console.warn("Aviso: Erro ao atualizar contato na Brevo:", contactError.message);
        // Continua mesmo se não for possível atualizar o contato
    }

    let sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.templateId = templateId;
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.params = finalParams;

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error: any) {
        const errorMessage = error.body?.message || error.message || 'Erro desconhecido ao enviar e-mail pela Brevo.';
        console.error("Erro na API da Brevo (sendTransacEmail):", error.body || error);

        // Se for um erro de API key desativada, vamos tentar fornecer uma mensagem mais clara
        if (errorMessage.toLowerCase().includes('api key is not enabled') ||
            errorMessage.toLowerCase().includes('not enabled') ||
            error.response?.status === 401) {
            console.error("A API key da Brevo está com problemas. Verifique as configurações da conta.");
        }

        throw new Error(errorMessage);
    }
}
