
'use server'

import type { Profile } from "./types";

const ASAAS_API_URL = 'https://api-sandbox.asaas.com/v3';
// A chave de API será lida das variáveis de ambiente do servidor.
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

type AsaasCustomer = {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    // ... outros campos que a API do Asaas retorna
};

async function getOrCreateAsaasCustomer(profile: Partial<Profile> & { fullName?: string, personType?: string, companyName?: string }): Promise<AsaasCustomer> {
    if (!ASAAS_API_KEY) {
        throw new Error("A chave da API do Asaas não está configurada.");
    }
    
    if (!profile.email) {
        throw new Error("O e-mail do perfil é obrigatório para criar um cliente no Asaas.");
    }

    // Se o perfil já tem um ID do Asaas, tenta buscá-lo para garantir que existe.
    if (profile.asaas_customer_id) {
        const getUrl = `${ASAAS_API_URL}/customers/${profile.asaas_customer_id}`;
        try {
            const response = await fetch(getUrl, {
                method: 'GET',
                headers: { 'access_token': ASAAS_API_KEY },
            });
            if (response.ok) {
                console.log(`Cliente Asaas encontrado para o perfil ${profile.id}`);
                return await response.json();
            }
            // Se não encontrou (404), vai para o fluxo de criação logo abaixo.
            if (response.status !== 404) {
                 const errorData = await response.json();
                 throw new Error(`Asaas API Error (GET): ${errorData.errors?.[0]?.description || response.statusText}`);
            }
        } catch (error: any) {
             console.error(`Falha ao buscar cliente no Asaas, tentando criar um novo. Erro: ${error.message}`);
        }
    }
    
    // Se não tem ID ou não foi encontrado, cria um novo cliente no Asaas.
    console.log(`Cliente Asaas não encontrado para o perfil ${profile.id}. Criando um novo...`);
    
    const name = profile.personType === 'cpf' 
        ? (profile.fullName || profile.full_name) 
        : (profile.companyName || profile.company_name);

    if (!name) {
        throw new Error("O campo name deve ser informado");
    }

    const payload: {
        name: string,
        cpfCnpj: string | undefined,
        email: string,
        phone?: string | null,
        mobilePhone?: string | null,
        postalCode?: string,
        addressNumber?: string,
        externalReference?: string
    } = {
        name,
        cpfCnpj: profile.cpf || profile.cnpj,
        email: profile.email,
        phone: profile.phone,
        mobilePhone: profile.phone,
        externalReference: profile.id
    };
    
    if (profile.address) {
        payload.postalCode = profile.address.match(/CEP: ([\d-]+)/)?.[1].replace(/\D/g, '');
        payload.addressNumber = profile.address.split(',')[1]?.trim().split(' ')[0];
    }


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
             throw new Error(`Asaas API Error (POST): ${responseData.errors?.[0]?.description || response.statusText}`);
        }
        console.log("Cliente criado no Asaas com sucesso:", responseData.id);
        return responseData;

    } catch (error: any) {
        console.error("Erro detalhado ao criar cliente no Asaas:", error);
        throw new Error(`Falha ao criar cliente no Asaas: ${error.message}`);
    }
}


export { getOrCreateAsaasCustomer };

    