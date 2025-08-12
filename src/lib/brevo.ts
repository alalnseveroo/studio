
'use server';

import * as Brevo from '@getbrevo/brevo';
import { createClient } from './supabase/server';

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
 * @param toEmail - O e-mail do destinatário.
 * @param templateId - O ID do template transacional na Brevo.
 * @param params - Parâmetros para preencher o template. Ex: { NOME_CLIENTE: '...', PINSECRET: '...' }
 * @param userId - O ID do usuário logado (contratada) para buscar o nome do remetente.
 */
export async function sendTransactionalEmail(
    toEmail: string, 
    templateId: number, 
    params: { [key: string]: any },
    userId: string
) {
    if (!BREVO_API_KEY) throw new Error("A chave da API da Brevo não está configurada.");

    const supabase = createClient();
    const { data: providerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', userId)
        .single();
        
    if (profileError) {
        console.error("Erro ao buscar perfil da contratada:", profileError);
        throw new Error("Não foi possível buscar os dados da contratada para o envio do e-mail.");
    }
    
    const providerName = providerProfile?.full_name || providerProfile?.company_name || 'Sua Assistente Virtual';
    
    // Adiciona o NOME_CONTRATADA aos parâmetros antes de atualizar o contato e enviar o e-mail
    const allParams = {
        ...params,
        NOME_CONTRATADA: providerName
    };

    // Garante que o contato e seus atributos estão atualizados antes de enviar o e-mail
    await addOrUpdateContact(toEmail, allParams);

    let sendSmtpEmail = new Brevo.SendSmtpEmail();
    
    sendSmtpEmail.templateId = templateId;
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.params = allParams;

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error: any) {
        const errorMessage = error.body?.message || error.message || 'Erro desconhecido ao enviar e-mail pela Brevo.';
        console.error("Erro na API da Brevo (sendTransacEmail):", error.body || error);
        throw new Error(errorMessage);
    }
}
