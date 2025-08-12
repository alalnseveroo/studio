
'use server';

import * as Brevo from '@getbrevo/brevo';

// Configuração da API da Brevo
const apiInstance = new Brevo.TransactionalEmailsApi();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
if (BREVO_API_KEY) {
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);
} else {
    console.warn("Chave da API da Brevo não encontrada. O envio de e-mails não funcionará.");
}

const contactsApi = new Brevo.ContactsApi();
if (BREVO_API_KEY) {
    contactsApi.setApiKey(Brevo.ContactsApiApiKeys.apiKey, BREVO_API_KEY);
}


/**
 * Adiciona ou atualiza um contato na Brevo, definindo seus atributos.
 * @param email - O e-mail do contato.
 * @param attributes - Um objeto com os atributos a serem definidos. Ex: { NOME_CLIENTE: 'Fulano de Tal' }
 */
export async function addOrUpdateContact(email: string, attributes: { [key: string]: any }) {
    if (!BREVO_API_KEY) throw new Error("A chave da API da Brevo não está configurada.");

    let createContact = new Brevo.CreateContact();
    createContact.email = email;
    
    // A API espera uma lista de objetos, mesmo que seja um só
    createContact.attributes = attributes;
    createContact.updateEnabled = true;

    try {
        await contactsApi.createContact(createContact);
    } catch (error: any) {
        // O erro pode ser complexo, então extraímos a mensagem principal se possível
        const errorMessage = error.body?.message || error.message || 'Erro desconhecido ao criar/atualizar contato na Brevo.';
        console.error("Erro na API da Brevo (createContact):", error.body || error);
        throw new Error(errorMessage);
    }
}


/**
 * Envia um e-mail transacional usando um template da Brevo.
 * @param toEmail - O e-mail do destinatário.
 * @param templateId - O ID do template transacional na Brevo.
 * @param params - Parâmetros para preencher o template. Ex: { pinsecret: '123456' }
 */
export async function sendTransactionalEmail(
    toEmail: string, 
    templateId: number, 
    params: { [key: string]: any }
) {
    if (!BREVO_API_KEY) throw new Error("A chave da API da Brevo não está configurada.");

    let sendSmtpEmail = new Brevo.SendSmtpEmail();
    
    sendSmtpEmail.templateId = templateId;
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.params = params;

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error: any) {
        const errorMessage = error.body?.message || error.message || 'Erro desconhecido ao enviar e-mail pela Brevo.';
        console.error("Erro na API da Brevo (sendTransacEmail):", error.body || error);
        throw new Error(errorMessage);
    }
}
