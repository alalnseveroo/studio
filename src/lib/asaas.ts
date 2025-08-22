
'use server'

import type { Profile, Cliente } from "./types";
import { createClient } from "./supabase/server";

const ASAAS_API_URL = 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmU4YmNhMjVmLWRhZDktNGU1Ni04YzY3LTBiYzNhNjVhMzEwNDo6JGFhY2hfMmY4MWY0MTItNTMwYS00MTUxLTgzYTQtZjM1NzA3YWZlZWUx';

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
        // 1. Get all notifications for the customer
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

        // 2. Prepare the batch update payload
        const batchPayload = {
            customer: customerId,
            notifications: notifications.map((notif: any) => ({
                id: notif.id,
                enabled: false,
                emailEnabledForProvider: false,
                smsEnabledForProvider: false,
                emailEnabledForCustomer: false,
                smsEnabledForCustomer: false,
                phoneCallEnabledForCustomer: false,
                whatsappEnabledForCustomer: false,
            })),
        };

        // 3. Send the batch update request
        const batchUpdateUrl = `${ASAAS_API_URL}/notifications/batch`;
        const postResponse = await fetch(batchUpdateUrl, {
            method: 'POST',
            headers: { 'accept': 'application/json', 'content-type': 'application/json', 'access_token': ASAAS_API_KEY },
            body: JSON.stringify(batchPayload),
        });

        if (!postResponse.ok) {
             const errorData = await postResponse.json();
            throw new Error(`Failed to disable notifications: ${errorData.errors?.[0]?.description || postResponse.statusText}`);
        }
        
        console.log(`Successfully disabled all notifications for customer ${customerId}.`);

    } catch (error: any) {
        console.error("Error disabling Asaas notifications:", error.message);
        // We don't throw here to avoid breaking the main flow if notification disabling fails
    }
}


/**
 * Creates or updates a customer in the Asaas platform.
 * Ensures essential data like name and CPF/CNPJ are always present.
 */
export async function getOrCreateAsaasCustomer(profile: Partial<Profile & Cliente>): Promise<AsaasCustomer | null> {
    if (!ASAAS_API_KEY || !ASAAS_API_URL) {
        throw new Error("Asaas API credentials are not configured.");
    }
    
    const name = profile.full_name || profile.company_name || profile.email;
    const cpfCnpj = profile.cpf || profile.cnpj;

    if (!name || !cpfCnpj || !profile.email) {
        throw new Error("Name, CPF/CNPJ and Email are required to create a customer in Asaas.");
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

    const method = profile.asaas_customer_id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'accept': 'application/json',
                'content-type': 'application/json',
                'access_token': ASAAS_API_KEY 
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
            // If it failed with 404 trying to update, try to create it
            if (response.status === 404 && profile.asaas_customer_id) {
                 const createResponse = await fetch(`${ASAAS_API_URL}/customers`, {
                    method: 'POST',
                    headers: { 'accept': 'application/json', 'content-type': 'application/json', 'access_token': ASAAS_API_KEY },
                    body: JSON.stringify(payload),
                });
                const createData = await createResponse.json();
                 if (!createResponse.ok) throw new Error(`Asaas API Error (CREATE after 404): ${createData.errors?.[0]?.description || createResponse.statusText}`);
                 
                 await disableAllNotifications(createData.id);
                 return createData;
            }
            throw new Error(`Asaas API Error: ${responseData.errors?.[0]?.description || response.statusText}`);
        }

        const customerId = responseData.id;

        // If a new customer was created, update our database with the ID and disable notifications
        if (method === 'POST' && customerId) {
            const tableName = 'is_completed' in profile ? 'profiles' : 'clientes';
            const supabase = createClient();
            await supabase.from(tableName).update({ asaas_customer_id: customerId }).eq('id', profile.id!);
            await disableAllNotifications(customerId);
        }

        return responseData;

    } catch (error: any) {
        console.error("Detailed error creating/updating Asaas customer:", error);
        throw new Error(`Failed to communicate with Asaas API: ${error.message}`);
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
