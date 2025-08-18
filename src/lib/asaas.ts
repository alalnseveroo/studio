
'use server'

<<<<<<< HEAD
import type { Profile } from "./types";

const ASAAS_API_URL = 'https://api.asaas.com/v3';
// A chave de API está definida diretamente para garantir o funcionamento.
const ASAAS_API_KEY = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojk0OTI5YTA4LWMwNGEtNDUwMy04YmU0LWZhZWU2MWQyOTAwNDo6JGFhY2hfMjgxN2I2NTktYmIyNi00Y2Y3LWExMmItM2RjODNiODUxODg2';

type AsaasCustomer = {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    // ... outros campos que a API do Asaas retorna
};

async function getOrCreateAsaasCustomer(profile: Partial<Profile & { fullName?: string, personType?: string, companyName?: string }>): Promise<AsaasCustomer> {
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
    
    // Lógica robusta para obter o nome, verificando todas as possibilidades.
    const name = profile.personType === 'cpf' 
      ? profile.fullName || profile.full_name
      : profile.companyName || profile.company_name;

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

export async function createPixCharge(customerId: string, value: number, description: string) {
    if (!ASAAS_API_KEY) {
        return { error: "A chave da API do Asaas não está configurada." };
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
=======
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
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e
            body: JSON.stringify(payload)
        });

        const data = await response.json();
<<<<<<< HEAD

        if (!response.ok) {
            throw new Error(data.errors?.[0]?.description || 'Erro desconhecido ao criar cobrança PIX.');
        }

        // Após criar o pagamento, buscamos o QR Code gerado pelo Asaas
        const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${data.id}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        const pixData = await pixResponse.json();
        
        if (!pixResponse.ok) {
             throw new Error(pixData.errors?.[0]?.description || 'Erro ao obter QR Code.');
        }

        return {
            id: data.id,
            status: data.status,
            encodedImage: pixData.encodedImage, // QR Code em base64
            payload: pixData.payload, // Chave "Copia e Cola"
            error: null
        };

    } catch (error: any) {
        console.error("Erro ao criar cobrança PIX no Asaas:", error);
        return { error: error.message };
    }
}

export { getOrCreateAsaasCustomer };
=======
        
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
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e
