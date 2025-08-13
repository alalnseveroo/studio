
'use server'

import type { Cliente, Profile } from "../types";

const CLIENT_WEBHOOK_URL = 'https://n8n-grupoteaser-n8n.2mbu8a.easypanel.host/webhook/c5665123-8b7c-473b-91b7-fa5547ca13f2';
const PROFILE_WEBHOOK_URL = 'https://n8n-grupoteaser-n8n.2mbu8a.easypanel.host/webhook/cfa45a7b-be79-4062-b351-ebd1a3fb8f90';

interface EnrichedCliente extends Cliente {
    portal_url?: string;
    provider_name?: string | null;
}

export async function sendClientWebhook(action: 'create' | 'update', clientData: EnrichedCliente) {

    const payload = {
        event: {
            action: action,
            entity: 'client',
            timestamp: new Date().toISOString(),
        },
        data: clientData,
    };

    try {
        const response = await fetch(CLIENT_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`O webhook de cliente retornou o status ${response.status}. Resposta: ${errorBody}`);
        }

        console.log(`Webhook para a ação '${action}' do cliente ${clientData.id} enviado com sucesso.`);
        return { success: true, data: await response.json() };

    } catch (error: any) {
        console.error(`Erro ao enviar webhook do cliente:`, error.message);
        throw new Error(`Falha ao enviar o webhook do cliente: ${error.message}`);
    }
}

export async function sendProfileWebhook(action: 'update', profileData: Profile) {
    const payload = {
        event: {
            action: action,
            entity: 'profile',
            timestamp: new Date().toISOString(),
        },
        data: profileData,
    };

    try {
        const response = await fetch(PROFILE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`O webhook de perfil retornou o status ${response.status}. Resposta: ${errorBody}`);
        }

        console.log(`Webhook para a ação '${action}' do perfil ${profileData.id} enviado com sucesso.`);
        return { success: true, data: await response.json() };

    } catch (error: any) {
        console.error(`Erro ao enviar webhook do perfil:`, error.message);
        throw new Error(`Falha ao enviar o webhook do perfil: ${error.message}`);
    }
}
