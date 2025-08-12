
'use server'

import type { Cliente } from "../types";

const WEBHOOK_URL = 'https://n8n-grupoteaser-n8n.2mbu8a.easypanel.host/webhook-test/c5665123-8b7c-473b-91b7-fa5547ca13f2';

export async function sendClientWebhook(action: 'create' | 'update', clientData: Cliente) {

    const payload = {
        event: {
            action: action,
            entity: 'client',
            timestamp: new Date().toISOString(),
        },
        data: clientData,
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            // Tenta ler o corpo da resposta para obter mais detalhes do erro
            const errorBody = await response.text();
            throw new Error(`O webhook retornou o status ${response.status}. Resposta: ${errorBody}`);
        }

        console.log(`Webhook para a ação '${action}' do cliente ${clientData.id} enviado com sucesso.`);
        return { success: true, data: await response.json() };

    } catch (error: any) {
        console.error(`Erro ao enviar webhook do cliente:`, error.message);
        throw new Error(`Falha ao enviar o webhook: ${error.message}`);
    }
}
