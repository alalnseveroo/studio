
'use client'

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from "qrcode.react";
import type { Profile, Cobranca } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

// --- Início da Lógica de Geração do Payload PIX (Adaptada para TS) ---

const formatValue = (id: string, value: string): string => {
    const size = String(value.length).padStart(2, '0');
    return id + size + value;
};

const calcularCRC16 = (payload: string): string => {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (const char of payload) {
        crc ^= char.charCodeAt(0) << 8;
        for (let i = 0; i < 8; i++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) & 0xFFFF) ^ polynomial;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
};


const gerarPixCopiaCola = (
    chave: string,
    nome: string,
    cidade: string,
    valor: number,
    txid: string
): string => {
    
    const valorFormatado = valor.toFixed(2);
    // Remove acentos e caracteres especiais, e limita o tamanho
    const nomeFormatado = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
    const cidadeFormatada = cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15);
    
    const ID_PAYLOAD_FORMAT_INDICATOR = '00';
    const ID_MERCHANT_ACCOUNT_INFORMATION = '26';
    const ID_MERCHANT_ACCOUNT_INFORMATION_GUI = '00';
    const ID_MERCHANT_ACCOUNT_INFORMATION_KEY = '01';
    const ID_MERCHANT_CATEGORY_CODE = '52';
    const ID_TRANSACTION_CURRENCY = '53';
    const ID_TRANSACTION_AMOUNT = '54';
    const ID_COUNTRY_CODE = '58';
    const ID_MERCHANT_NAME = '59';
    const ID_MERCHANT_CITY = '60';
    const ID_ADDITIONAL_DATA_FIELD_TEMPLATE = '62';
    const ID_ADDITIONAL_DATA_FIELD_TEMPLATE_TXID = '05';
    const ID_CRC16 = '63';

    // Merchant Account Info (ID do BACEN + chave Pix)
    const gui = "br.gov.bcb.pix";
    const guiFormatado = formatValue(ID_MERCHANT_ACCOUNT_INFORMATION_GUI, gui);
    const chaveFormatada = formatValue(ID_MERCHANT_ACCOUNT_INFORMATION_KEY, chave);
    const merchantAccountInfo = formatValue(ID_MERCHANT_ACCOUNT_INFORMATION, guiFormatado + chaveFormatada);

    const txidFormatado = formatValue(ID_ADDITIONAL_DATA_FIELD_TEMPLATE_TXID, txid);
    const campoAdicional = formatValue(ID_ADDITIONAL_DATA_FIELD_TEMPLATE, txidFormatado);

    let payload =
        formatValue(ID_PAYLOAD_FORMAT_INDICATOR, '01') +
        merchantAccountInfo +
        formatValue(ID_MERCHANT_CATEGORY_CODE, '0000') +
        formatValue(ID_TRANSACTION_CURRENCY, '986') +
        formatValue(ID_TRANSACTION_AMOUNT, valorFormatado) +
        formatValue(ID_COUNTRY_CODE, 'BR') +
        formatValue(ID_MERCHANT_NAME, nomeFormatado) +
        formatValue(ID_MERCHANT_CITY, cidadeFormatada) +
        campoAdicional;
        
    const crc = calcularCRC16(payload + ID_CRC16 + '04');
    
    return payload + formatValue(ID_CRC16, crc);
};

// --- Fim da Lógica ---

interface StaticPixQRCodeProps {
    provider: Profile;
    charge: Cobranca;
}

export function StaticPixQRCode({ provider, charge }: StaticPixQRCodeProps) {
    const [payload, setPayload] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        const pixKey = provider.pix_key; // Use a chave PIX do perfil
        if (!pixKey) {
            console.error("Chave PIX do prestador não encontrada no perfil.");
            setIsLoading(false);
            return;
        }

        const merchantName = (provider.full_name || provider.company_name || 'Prestador').substring(0, 25);
        const merchantCity = (provider.address?.split(',').slice(-2, -1)[0]?.trim() || 'SAO PAULO').substring(0, 15);
        const txid = charge.id.substring(0, 25).replace(/[^a-zA-Z0-9]/g, '0');
        const amount = charge.value;

        const finalPayload = gerarPixCopiaCola(pixKey, merchantName, merchantCity, amount, txid);
        
        setPayload(finalPayload);
        setIsLoading(false);
    }, [provider, charge]);
    
    const handleCopy = () => {
        if (!payload) return;
        navigator.clipboard.writeText(payload);
        setIsCopied(true);
        toast({
            title: "Código Copiado!",
            description: "O código PIX Copia e Cola foi copiado para a área de transferência.",
        });
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!payload) {
         return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro ao Gerar PIX</AlertTitle>
                <AlertDescription>
                   Não foi possível gerar o código PIX. Verifique se uma <strong>Chave PIX</strong> está configurada no seu perfil.
                </AlertDescription>
            </Alert>
         )
    }

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-2 bg-white rounded-lg border">
                <QRCode value={payload} size={220} />
            </div>
            
            <div className="w-full max-w-sm space-y-2 mt-4">
                <p className="text-sm font-medium text-center">PIX Copia e Cola</p>
                <div className="relative">
                    <textarea
                        readOnly
                        value={payload}
                        className="w-full p-2 pr-10 text-xs border rounded-md bg-muted text-muted-foreground h-20 resize-none"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
                        onClick={handleCopy}
                    >
                        {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
