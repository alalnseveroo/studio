
'use server'

import type { Profile, Cliente } from "./types";

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

type AsaasCustomer = {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    // ... outros campos que a API do Asaas retorna
};

async function getOrCreateAsaasCustomer(profile: Profile | Cliente): Promise<AsaasCustomer> {
    if (!ASAAS_API_KEY) {
        throw new Error("A chave da API do Asaas não está configurada.");
    }
    
    // Se o perfil já tem um ID do Asaas, retorna os dados (ou busca novamente para garantir que está atualizado)
    if (profile.asaas_customer_id) {
        const url = `${ASAAS_API_URL}/customers/${profile.asaas_customer_id}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                return await response.json();
            }
            // Se não encontrou (404), tentará criar novamente.
            if (response.status !== 404) {
                 const errorData = await response.json();
                 throw new Error(`Asaas API Error (GET): ${errorData.errors?.[0]?.description || response.statusText}`);
            }
        } catch (error: any) {
             throw new Error(`Falha ao buscar cliente no Asaas: ${error.message}`);
        }
    }
    
    // Se não tem ID, cria um novo cliente no Asaas
    const payload = {
        name: profile.full_name || profile.company_name,
        email: profile.email,
        cpfCnpj: profile.cpf || profile.cnpj,
        phone: profile.phone?.replace(/\D/g, ''),
        mobilePhone: profile.phone?.replace(/\D/g, ''),
        address: profile.address?.split(',')[0],
        addressNumber: profile.address?.split(',')[1]?.trim().split(' ')[0],
        province: profile.address?.split('-')[1]?.split(',')[0]?.trim(),
        postalCode: profile.address?.match(/CEP: ([\d-]+)/)?.[1].replace(/\D/g, ''),
    };

    const url = `${ASAAS_API_URL}/customers`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
             throw new Error(`Asaas API Error (POST): ${responseData.errors?.[0]?.description || response.statusText}`);
        }
        return responseData;

    } catch (error: any) {
        console.error("Erro ao criar cliente no Asaas:", error);
        throw new Error(`Falha ao criar cliente no Asaas: ${error.message}`);
    }
}


export { getOrCreateAsaasCustomer };
