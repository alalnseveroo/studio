
'use server'

import type { Profile, Cliente } from "./types";
import { createClient } from "./supabase/server";

const ASAAS_API_URL = process.env.ASAAS_API_URL;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

type AsaasCustomer = {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
};

/**
 * Cria ou atualiza um cliente na plataforma Asaas.
 * Garante que os dados essenciais como nome e CPF/CNPJ estejam sempre presentes.
 */
export async function getOrCreateAsaasCustomer(profile: Partial<Profile & Cliente>): Promise<AsaasCustomer | null> {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        throw new Error("As credenciais da API do Asaas não estão configuradas.");
    }
    
    // Garante que o nome e cpfCnpj não sejam nulos
    const name = profile.full_name || profile.company_name || profile.email;
    const cpfCnpj = profile.cpf || profile.cnpj;

    if (!name || !cpfCnpj || !profile.email) {
        throw new Error("Nome, CPF/CNPJ e E-mail são obrigatórios para criar um cliente no Asaas.");
    }

    const payload = {
        name,
        cpfCnpj,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        externalReference: profile.id
    };

    const url = profile.asaas_customer_id
        ? `${ASAAS_API_URL}/customers/${profile.asaas_customer_id}`
        : `${ASAAS_API_URL}/customers`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'accept': 'application/json',
                'content-type': 'application/json',
                'access_token': ASAAS_API_KEY 
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
            // Se falhou com 404 ao tentar atualizar, tenta criar
            if (response.status === 404 && profile.asaas_customer_id) {
                 const createResponse = await fetch(`${ASAAS_API_URL}/customers`, {
                    method: 'POST',
                    headers: { 'accept': 'application/json', 'content-type': 'application/json', 'access_token': ASAAS_API_KEY },
                    body: JSON.stringify(payload),
                });
                const createData = await createResponse.json();
                 if (!createResponse.ok) throw new Error(`Asaas API Error (CREATE after 404): ${createData.errors?.[0]?.description || createResponse.statusText}`);
                 return createData;
            }
            throw new Error(`Asaas API Error: ${responseData.errors?.[0]?.description || response.statusText}`);
        }

        // Se um novo cliente foi criado, atualiza nosso banco com o ID
        if (responseData.id && !profile.asaas_customer_id) {
            const tableName = 'is_completed' in profile ? 'profiles' : 'clientes';
            const supabase = createClient();
            await supabase.from(tableName).update({ asaas_customer_id: responseData.id }).eq('id', profile.id!);
        }

        return responseData;

    } catch (error: any) {
        console.error("Erro detalhado ao criar/atualizar cliente no Asaas:", error);
        throw new Error(`Falha na comunicação com a API do Asaas: ${error.message}`);
    }
}


/**
 * Cria uma cobrança na Asaas e retorna os dados para pagamento via PIX.
 * Usa billingType: 'UNDEFINED' para máxima compatibilidade.
 */
export async function createPixCharge(customerId: string, value: number, description: string): Promise<{id: string | null; encodedImage: string | null; payload: string | null; error: string | null}> {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        return { id: null, encodedImage: null, payload: null, error: "As credenciais da API do Asaas não estão configuradas." };
    }

    const today = new Date();
    const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const paymentPayload = {
        customer: customerId,
        billingType: "UNDEFINED", // Chave da solução: Permite que a Asaas gerencie o PIX.
        value,
        dueDate,
        description,
        externalReference: `CREDITS_${customerId}_${Date.now()}`
    };
    
    try {
        // 1. Criar a cobrança
        const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: { 'accept': 'application/json', 'content-type': 'application/json', 'access_token': ASAAS_API_KEY },
            body: JSON.stringify(paymentPayload)
        });

        const paymentData = await paymentResponse.json();
        if (!paymentResponse.ok) {
            throw new Error(paymentData.errors?.[0]?.description || 'Erro ao criar cobrança no Asaas.');
        }

        const paymentId = paymentData.id;

        // 2. Obter o QR Code para a cobrança criada
        const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
             method: 'GET',
            headers: { 'access_token': ASAAS_API_KEY, 'accept': 'application/json' }
        });

        const pixData = await pixResponse.json();
        if (!pixResponse.ok) {
             throw new Error(pixData.errors?.[0]?.description || 'Erro ao obter QR Code do Asaas.');
        }

        return {
            id: paymentId,
            encodedImage: pixData.encodedImage, 
            payload: pixData.payload, 
            error: null
        };

    } catch (error: any) {
        console.error("Erro ao criar cobrança PIX no Asaas:", error);
        return { id: null, encodedImage: null, payload: null, error: error.message };
    }
}


/**
 * Cria uma cobrança para um cliente (usado no fluxo recorrente).
 */
export async function createAsaasCharge(chargeDetails: {
    customer: string;
    value: number;
    dueDate: string;
    description: string;
}) {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        return { payment: null, error: { message: "As credenciais da API do Asaas não estão configuradas." } };
    }

    try {
        const payload = {
            billingType: 'UNDEFINED',
            ...chargeDetails
        };

        const response = await fetch(`${ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.errors?.[0]?.description || 'Erro ao criar cobrança no Asaas.');
        }

        return { payment: data, error: null };

    } catch (e: any) {
        return { payment: null, error: { message: e.message || 'Erro de conexão com a API do Asaas.' } };
    }
}

/**
 * Obtém o QR Code de uma cobrança já existente.
 */
export async function getAsaasPixCharge(paymentId: string) {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        return { qrCode: null, payload: null, error: { message: "As credenciais da API do Asaas não estão configuradas." } };
    }
    try {
        const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
            method: 'GET',
            headers: { 'access_token': ASAAS_API_KEY, 'accept': 'application/json' }
        });

        const pixData = await pixResponse.json();
        if (!pixResponse.ok) {
             throw new Error(pixData.errors?.[0]?.description || 'Erro ao obter QR Code.');
        }

        return {
            qrCode: pixData.encodedImage,
            payload: pixData.payload,
            error: null
        };
    } catch (error: any) {
        return { qrCode: null, payload: null, error: { message: error.message } };
    }
}
