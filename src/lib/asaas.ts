
'use server'

import { createClient } from "./supabase/server";
import type { Cliente } from "./types";

const ASAAS_API_URL = process.env.ASAAS_API_URL;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

if (!ASAAS_API_URL || !ASAAS_API_KEY) {
    console.warn("Asaas API URL or Key is not defined. Asaas integration will not work.");
}

const asaasHeaders = {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_KEY || ''
};


// Função para buscar ou criar cliente no Asaas
export async function getOrCreateAsaasCustomer(client: Cliente, userId: string): Promise<{ asaas_customer_id: string | null, error: { message: string } | null }> {
    if (client.asaas_customer_id) {
        // Opcional: verificar se o cliente ainda existe no Asaas
        // Por agora, apenas retornamos o ID existente.
        return { asaas_customer_id: client.asaas_customer_id, error: null };
    }

    try {
        const payload = {
            name: client.full_name || client.company_name,
            email: client.email,
            cpfCnpj: client.cpf || client.cnpj,
            // mobilePhone: client.phone?.replace(/\D/g, ''), // Asaas exige formato específico
            address: client.address?.split(',')[0].trim(),
            addressNumber: client.address?.match(/, (\d+)/)?.[1],
            province: client.address?.match(/- (.*?),/)?.[1].trim(),
            postalCode: client.address?.match(/CEP: ([\d-]+)/)?.[1].replace(/\D/g, ''),
            externalReference: client.id, // Vincula o cliente do Asaas ao nosso ID de cliente
        };

        const response = await fetch(`${ASAAS_API_URL}/customers`, {
            method: 'POST',
            headers: asaasHeaders,
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.errors?.[0]?.description || 'Erro desconhecido ao criar cliente no Asaas.';
            return { asaas_customer_id: null, error: { message: errorMessage } };
        }

        const newAsaasCustomerId = data.id;

        // Salvar o ID do Asaas no nosso banco de dados
        const supabase = createClient();
        const { error: dbError } = await supabase
            .from('clientes')
            .update({ asaas_customer_id: newAsaasCustomerId })
            .eq('id', client.id)
            .eq('user_id', userId);

        if (dbError) {
            // Se falhar ao salvar, o próximo fluxo tentará criar de novo.
            // Poderia ter uma lógica mais robusta aqui para evitar duplicados.
            console.error("Falha ao salvar asaas_customer_id no Supabase:", dbError);
        }

        return { asaas_customer_id: newAsaasCustomerId, error: null };

    } catch (e: any) {
        return { asaas_customer_id: null, error: { message: e.message || 'Erro de conexão com a API do Asaas.' } };
    }
}


// Função para criar cobrança PIX no Asaas
export async function createAsaasCharge(chargeDetails: {
    customer: string;
    value: number;
    dueDate: string;
    description: string;
}) {
    try {
        const payload = {
            billingType: 'UNDEFINED', // Permite PIX e Cartão
            ...chargeDetails
        };

        const response = await fetch(`${ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: asaasHeaders,
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            const errorMessage = data.errors?.[0]?.description || 'Erro desconhecido ao criar cobrança no Asaas.';
            return { payment: null, error: { message: errorMessage } };
        }

        return { payment: data, error: null };

    } catch (e: any) {
        return { payment: null, error: { message: e.message || 'Erro de conexão com a API do Asaas ao criar cobrança.' } };
    }
}

// Função para gerar um link de pagamento para uma cobrança existente
export async function createAsaasPaymentLink(paymentId: string) {
     try {
        const payload = {
            paymentId,
            billingType: "UNDEFINED"
        }

        const response = await fetch(`${ASAAS_API_URL}/paymentLinks`, {
            method: 'POST',
            headers: asaasHeaders,
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            const errorMessage = data.errors?.[0]?.description || 'Erro desconhecido ao criar o link de pagamento no Asaas.';
            return { link: null, error: { message: errorMessage } };
        }

        return { link: data.url, error: null };

    } catch (e: any) {
        return { link: null, error: { message: e.message || 'Erro de conexão com a API do Asaas ao criar link de pagamento.' } };
    }
}


// Função para buscar o QR Code de uma cobrança PIX
export async function getAsaasPixCharge(paymentId: string) {
    try {
        const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
            method: 'GET',
            headers: asaasHeaders,
        });

        const data = await response.json();

        if (!response.ok) {
             const errorMessage = data.errors?.[0]?.description || 'Erro desconhecido ao buscar QR Code no Asaas.';
            return { qrCode: null, payload: null, error: { message: errorMessage } };
        }

        return { qrCode: data.encodedImage, payload: data.payload, error: null };
    } catch (e: any) {
        return { qrCode: null, payload: null, error: { message: e.message || 'Erro de conexão com a API do Asaas ao buscar QR Code.' } };
    }
}
