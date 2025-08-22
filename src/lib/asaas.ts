
'use server'

import type { Profile, Cliente } from "./types";
import { createClient } from "./supabase/server";

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

type AsaasCustomer = {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
};

async function disableAllNotifications(customerId: string) {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        console.error("Asaas API credentials are not configured.");
        return;
    }

    try {
        const getNotificationsUrl = `${ASAAS_API_URL}/customers/${customerId}/notifications`;
        const getResponse = await fetch(getNotificationsUrl, {
            method: 'GET',
            headers: { 'accept': 'application/json', 'access_token': ASAAS_API_KEY },
        });

        if (!getResponse.ok) {
            const errorData = await getResponse.json();
            throw new Error(`Failed to fetch notifications: ${errorData.errors?.[0]?.description || getResponse.statusText}`);
        }

        const { data: notifications } = await getResponse.json();

        if (!notifications || notifications.length === 0) {
            console.log(`No notifications found for customer ${customerId} to disable.`);
            return;
        }

        const batchPayload = notifications.map((notif: any) => ({
            id: notif.id,
            enabled: false,
            emailEnabledForProvider: false,
            smsEnabledForProvider: false,
            emailEnabledForCustomer: false,
            smsEnabledForCustomer: false,
            phoneCallEnabledForCustomer: false,
            whatsappEnabledForCustomer: false,
        }));
        
        const response = await fetch(`${ASAAS_API_URL}/notifications/batch`, {
            method: 'POST',
            headers: { 'accept': 'application/json', 'content-type': 'application/json', 'access_token': ASAAS_API_KEY },
            body: JSON.stringify({ customer: customerId, notifications: batchPayload }),
        });
        
        if (!response.ok) {
             const errorData = await response.json();
            throw new Error(`Failed to disable notifications: ${errorData.errors?.[0]?.description || response.statusText}`);
        }
        
        console.log(`Successfully disabled all notifications for customer ${customerId}.`);

    } catch (error: any) {
        console.error("Error disabling Asaas notifications:", error.message);
    }
}


/**
 * Gets, creates, or updates a customer in the Asaas platform.
 * Avoids duplication by checking for existing CPF/CNPJ before creating.
 */
export async function getOrCreateAsaasCustomer(profile: Partial<Profile & Cliente>): Promise<AsaasCustomer | null> {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        throw new Error("Asaas API credentials are not configured.");
    }
    
    const name = profile.full_name || profile.company_name || profile.email;
    const cpfCnpj = profile.cpf || profile.cnpj;

    if (!name || !cpfCnpj || !profile.email) {
        throw new Error("Name, CPF/CNPJ and Email are required to create or find a customer in Asaas.");
    }

    try {
        // Step 1: Check if customer exists in Asaas using cpfCnpj
        const searchUrl = `${ASAAS_API_URL}/customers?cpfCnpj=${cpfCnpj}`;
        const searchResponse = await fetch(searchUrl, {
            method: 'GET',
            headers: { 'accept': 'application/json', 'access_token': ASAAS_API_KEY },
        });

        if (!searchResponse.ok) {
            const errorData = await searchResponse.json();
            throw new Error(`Asaas API Error (Search): ${errorData.errors?.[0]?.description || searchResponse.statusText}`);
        }
        
        const searchData = await searchResponse.json();
        const existingCustomer = searchData.data && searchData.data.length > 0 ? searchData.data[0] : null;

        let asaasCustomer: AsaasCustomer;

        const customerPayload = {
            name,
            cpfCnpj,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
            externalReference: profile.id
        };

        if (existingCustomer) {
            // Step 2a: Customer exists, so we update them.
            const updateUrl = `${ASAAS_API_URL}/customers/${existingCustomer.id}`;
            const updateResponse = await fetch(updateUrl, {
                method: 'PUT',
                headers: { 'accept': 'application/json', 'content-type': 'application/json', 'access_token': ASAAS_API_KEY },
                body: JSON.stringify(customerPayload),
            });
            const updateData = await updateResponse.json();
            if (!updateResponse.ok) throw new Error(`Asaas API Error (Update): ${updateData.errors?.[0]?.description || updateResponse.statusText}`);
            
            asaasCustomer = updateData;
        } else {
            // Step 2b: Customer doesn't exist, so we create them.
            const createUrl = `${ASAAS_API_URL}/customers`;
            const createResponse = await fetch(createUrl, {
                method: 'POST',
                headers: { 'accept': 'application/json', 'content-type': 'application/json', 'access_token': ASAAS_API_KEY },
                body: JSON.stringify(customerPayload),
            });
            const createData = await createResponse.json();
            if (!createResponse.ok) throw new Error(`Asaas API Error (Create): ${createData.errors?.[0]?.description || createResponse.statusText}`);

            asaasCustomer = createData;
            // Disable notifications only for newly created customers
            await disableAllNotifications(asaasCustomer.id);
        }

        // Step 3: Update our local database with the correct Asaas customer ID
        if (asaasCustomer && asaasCustomer.id) {
             const tableName = 'is_completed' in profile ? 'profiles' : 'clientes';
             const supabase = createClient();
             await supabase.from(tableName).update({ asaas_customer_id: asaasCustomer.id }).eq('id', profile.id!);
        }

        return asaasCustomer;

    } catch (error: any) {
        console.error("Detailed error in getOrCreateAsaasCustomer:", error);
        throw new Error(`Failed to sync with Asaas API: ${error.message}`);
    }
}


/**
 * Creates a charge in Asaas and returns the data for PIX payment.
 */
export async function createPixCharge(customerId: string, value: number, description: string): Promise<{id: string | null; encodedImage: string | null; payload: string | null; error: string | null}> {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        return { id: null, encodedImage: null, payload: null, error: "Asaas API credentials are not configured." };
    }

    const today = new Date();
    const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const paymentPayload = {
        customer: customerId,
        billingType: "UNDEFINED",
        value,
        dueDate,
        description,
        externalReference: `CREDITS_${customerId}_${Date.now()}`
    };
    
    try {
        const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: { 'accept': 'application/json', 'content-type': 'application/json', 'access_token': ASAAS_API_KEY },
            body: JSON.stringify(paymentPayload)
        });

        const paymentData = await paymentResponse.json();
        if (!paymentResponse.ok) {
            throw new Error(paymentData.errors?.[0]?.description || 'Error creating charge in Asaas.');
        }

        const paymentId = paymentData.id;

        const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
             method: 'GET',
            headers: { 'access_token': ASAAS_API_KEY, 'accept': 'application/json' }
        });

        const pixData = await pixResponse.json();
        if (!pixResponse.ok) {
             throw new Error(pixData.errors?.[0]?.description || 'Error getting QR Code from Asaas.');
        }

        return {
            id: paymentId,
            encodedImage: pixData.encodedImage, 
            payload: pixData.payload, 
            error: null
        };

    } catch (error: any) {
        console.error("Error creating PIX charge in Asaas:", error);
        return { id: null, encodedImage: null, payload: null, error: error.message };
    }
}


/**
 * Creates a charge for a customer (used in the recurring flow).
 */
export async function createAsaasCharge(chargeDetails: {
    customer: string;
    value: number;
    dueDate: string;
    description: string;
}) {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        return { payment: null, error: { message: "Asaas API credentials are not configured." } };
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
            throw new Error(data.errors?.[0]?.description || 'Error creating charge in Asaas.');
        }

        return { payment: data, error: null };

    } catch (e: any) {
        return { payment: null, error: { message: e.message || 'Connection error with Asaas API.' } };
    }
}

/**
 * Gets the QR Code of an existing charge.
 */
export async function getAsaasPixCharge(paymentId: string) {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        return { qrCode: null, payload: null, error: { message: "Asaas API credentials are not configured." } };
    }
    try {
        const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
            method: 'GET',
            headers: { 'access_token': ASAAS_API_KEY, 'accept': 'application/json' }
        });

        const pixData = await pixResponse.json();
        if (!pixResponse.ok) {
             throw new Error(pixData.errors?.[0]?.description || 'Error getting QR Code.');
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
