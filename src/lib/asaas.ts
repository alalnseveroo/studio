
'use server'

import type { Profile } from "./types";
import { createClient } from "./supabase/server";
import type { Cliente } from "./types";

const ASAAS_API_URL = process.env.ASAAS_API_URL;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

type AsaasCustomer = {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    // ... outros campos que a API do Asaas retorna
};

async function getOrCreateAsaasCustomer(profile: Partial<Profile & Cliente>): Promise<AsaasCustomer | null> {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        throw new Error("As credenciais da API do Asaas não estão configuradas nas variáveis de ambiente.");
    }
    
    if (!profile.email) {
        throw new Error("O e-mail do perfil é obrigatório para criar ou atualizar um cliente no Asaas.");
    }
    
    const name = profile.full_name || profile.company_name || profile.email;
    const cpfCnpj = profile.cpf || profile.cnpj;

    if (!name || !cpfCnpj) {
        throw new Error("Nome e CPF/CNPJ são obrigatórios para criar um cliente no Asaas.");
    }

    const payload = {
        name,
        cpfCnpj,
        email: profile.email,
        phone: profile.phone,
        mobilePhone: profile.phone,
        address: profile.address,
        externalReference: profile.id
    };

    // Se já temos um ID Asaas, tentamos atualizar o cliente (POST em cliente existente atualiza)
    if (profile.asaas_customer_id) {
        const updateUrl = `${ASAAS_API_URL}/customers/${profile.asaas_customer_id}`;
        try {
            const response = await fetch(updateUrl, {
                method: 'POST',
                headers: { 
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'access_token': ASAAS_API_KEY 
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json();
            if (response.ok) {
                console.log(`Cliente Asaas ${profile.asaas_customer_id} atualizado com sucesso.`);
                return responseData;
            }
             // Se o cliente não foi encontrado (404), vamos tentar criá-lo novamente abaixo.
            if (response.status !== 404) {
                 throw new Error(`Asaas API Error (UPDATE): ${responseData.errors?.[0]?.description || response.statusText}`);
            }

        } catch (error: any) {
             console.error(`Falha ao ATUALIZAR cliente no Asaas (ID: ${profile.asaas_customer_id}), tentando criar um novo. Erro: ${error.message}`);
        }
    }
    
    // Se não tinha ID ou a atualização falhou, cria um novo cliente
    console.log(`Criando um novo cliente no Asaas para o perfil ${profile.id}...`);
    
    const createUrl = `${ASAAS_API_URL}/customers`;
    try {
        const response = await fetch(createUrl, {
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
             throw new Error(`Asaas API Error (CREATE): ${responseData.errors?.[0]?.description || response.statusText}`);
        }
        console.log("Cliente criado no Asaas com sucesso:", responseData.id);

        const tableName = 'is_completed' in profile ? 'profiles' : 'clientes';
        const supabase = createClient();
        const { error: updateError } = await supabase
            .from(tableName)
            .update({ asaas_customer_id: responseData.id })
            .eq('id', profile.id!);

        if (updateError) {
             console.error(`Falha ao salvar o asaas_customer_id para o ID ${profile.id} na tabela ${tableName}:`, updateError.message);
        }

        return responseData;

    } catch (error: any) {
        console.error("Erro detalhado ao criar/atualizar cliente no Asaas:", error);
        throw new Error(`Falha na comunicação com a API do Asaas: ${error.message}`);
    }
}


export async function createPixCharge(customerId: string, value: number, description: string): Promise<{id: string | null, status: string | null, encodedImage: string | null, payload: string | null, error: string | null}> {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        return { id: null, status: null, encodedImage: null, payload: null, error: "As credenciais da API do Asaas não estão configuradas nas variáveis de ambiente." };
    }

    const today = new Date();
    const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const externalReference = `CREDITS_${customerId}_${Date.now()}`;

    const payload = {
        billingType: "PIX",
        customer: customerId,
        value,
        dueDate,
        description,
        externalReference
    };
    
    try {
        const response = await fetch(`${ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'access_token': ASAAS_API_KEY,
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.errors?.[0]?.description || 'Erro desconhecido ao criar cobrança PIX.');
        }

        const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${data.id}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY, 'accept': 'application/json' }
        });

        const pixData = await pixResponse.json();
        
        if (!pixResponse.ok) {
             throw new Error(pixData.errors?.[0]?.description || 'Erro ao obter QR Code.');
        }

        return {
            id: data.id,
            status: data.status,
            encodedImage: pixData.encodedImage, 
            payload: pixData.payload, 
            error: null
        };

    } catch (error: any) {
        console.error("Erro ao criar cobrança PIX no Asaas:", error);
        return { id: null, status: null, encodedImage: null, payload: null, error: error.message };
    }
}

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
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY
            },
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


export async function getAsaasPixCharge(paymentId: string) {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        return { qrCode: null, payload: null, error: { message: "As credenciais da API do Asaas não estão configuradas." } };
    }
    try {
        const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
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

export { getOrCreateAsaasCustomer };
