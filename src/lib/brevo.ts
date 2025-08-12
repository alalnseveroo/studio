
'use server';

import * as Brevo from '@getbrevo/brevo';
import { createClient } from './supabase/server';
import type { Profile } from './types';

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

/**
 * Adiciona ou atualiza um contato na Brevo, definindo seus atributos.
 * @param email - O e-mail do contato.
 * @param attributes - Um objeto com os atributos a serem definidos. Ex: { NOME_CLIENTE: 'Fulano de Tal' }
 */
export async function addOrUpdateContact(email: string, attributes: { [key: string]: any }) {
    if (!BREVO_API_KEY) throw new Error("A chave da API da Brevo não está configurada.");

    let existingContact;
    try {
        existingContact = await contactsApi.getContactInfo(email);
    } catch (error: any) {
        if (error.response?.statusCode !== 404) {
            const errorMessage = error.body?.message || error.message || 'Erro desconhecido ao verificar contato na Brevo.';
            console.error("Erro na API da Brevo (getContactInfo):", error.body || error);
            throw new Error(errorMessage);
        }
    }

    if (existingContact) {
        let updateContact = new Brevo.UpdateContact();
        updateContact.attributes = attributes;
        try {
            await contactsApi.updateContact(email, updateContact);
        } catch (updateError: any) {
            const errorMessage = updateError.body?.message || updateError.message || 'Erro desconhecido ao atualizar contato na Brevo.';
            console.error("Erro na API da Brevo (updateContact):", updateError.body || updateError);
            throw new Error(errorMessage);
        }
    } else {
        let createContact = new Brevo.CreateContact();
        createContact.email = email;
        createContact.attributes = attributes;
        createContact.updateEnabled = true;
        try {
            await contactsApi.createContact(createContact);
        } catch (createError: any) {
            const errorMessage = createError.body?.message || createError.message || 'Erro desconhecido ao criar contato na Brevo.';
            console.error("Erro na API da Brevo (createContact):", createError.body || createError);
            throw new Error(errorMessage);
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
    
    const allParams = {
        ...params,
        NOME_CONTRATADA: providerName
    };

    try {
        await addOrUpdateContact(toEmail, allParams);
    } catch (contactError: any) {
        console.warn(`Falha ao sincronizar atributos do contato ${toEmail} antes do envio: ${contactError.message}`);
    }

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
