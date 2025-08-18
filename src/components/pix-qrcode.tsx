
'use client'

import { useState, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
<<<<<<< HEAD
import { Copy, RefreshCw } from 'lucide-react';
import Image from 'next/image';
=======
import { Copy, RefreshCw, Loader2 } from 'lucide-react';
import { getAsaasPixCharge } from '@/lib/asaas';
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e

interface PixQRCodeProps {
    paymentId: string;
}

<<<<<<< HEAD
// NOTE: This component is currently UNUSED. The logic was replaced by pix-qrcode-modal.tsx
// which gets the QR code directly from the Asaas API to prevent validation errors.
// This file is kept for historical purposes but can be removed.

const calcularCRC16 = (payload: string): string => {
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    for (let i = 0; i < payload.length; i++) {
        let byte = payload.charCodeAt(i);
        crc ^= (byte << 8);
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ polynomial : crc << 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};


const gerarPixCopiaCola = (chave: string, nome: string, cidade: string, valor: number, txid: string) => {
    const sanitize = (text: string, maxLength: number) => {
        return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") 
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .substring(0, maxLength)
            .toUpperCase()
            .trim();
    };

    const chaveSanitizada = chave.replace(/\D/g, '');
    const nomeSanitizado = sanitize(nome, 25);
    const cidadeSanitizada = sanitize(cidade, 15);
    const txidSanitizado = sanitize(txid, 25).replace(/\s/g, '');
    const valorFormatado = valor.toFixed(2);

    const formatField = (id: string, val: string) => {
        const len = val.length.toString().padStart(2, '0');
        return `${id}${len}${val}`;
    };

    const merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', chaveSanitizada);
    const additionalData = formatField('05', txidSanitizado);
    
    let payload = [
        formatField('00', '01'),
        formatField('26', merchantAccountInfo),
        formatField('52', '0000'),
        formatField('53', '986'),
        formatField('54', valorFormatado),
        formatField('58', 'BR'),
        formatField('59', nomeSanitizado),
        formatField('60', cidadeSanitizada),
        formatField('62', additionalData),
    ].join('') + "6304";
    
    const crc = calcularCRC16(payload);

    return `${payload}${crc}`;
};


const PixQRCode: React.FC<PixQRCodeProps> = ({ pixKey, value, beneficiaryName, beneficiaryCity }) => {
=======
const PixQRCode: React.FC<PixQRCodeProps> = ({ paymentId }) => {
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e
    const { toast } = useToast();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [payload, setPayload] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCharge = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { qrCode: fetchedQrCode, payload: fetchedPayload, error } = await getAsaasPixCharge(paymentId);
            if (error) {
                throw new Error(error.message);
            }
            setQrCode(fetchedQrCode);
            setPayload(fetchedPayload);
        } catch (err: any) {
            setError(err.message || 'Não foi possível carregar os dados da cobrança.');
            toast({
                variant: 'destructive',
                title: 'Erro ao Carregar Cobrança',
                description: err.message || 'Verifique se a cobrança é válida e tente novamente.'
            })
        } finally {
            setIsLoading(false);
        }
    }, [paymentId, toast]);

    useEffect(() => {
        fetchCharge();
    }, [fetchCharge]);

    const handleCopy = () => {
        if (payload) {
            navigator.clipboard.writeText(payload);
            toast({
                title: "Código Copiado!",
                description: "O código PIX Copia e Cola foi copiado para a área de transferência.",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border p-6 min-h-[350px]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Carregando dados do pagamento...</p>
            </div>
        )
    }

    if (error) {
         return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive bg-destructive/10 p-6 min-h-[350px]">
                <h3 className="font-semibold text-destructive">Erro na Cobrança</h3>
                <p className="text-center text-sm text-destructive">{error}</p>
                 <Button onClick={fetchCharge} variant="destructive">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar Novamente
                </Button>
            </div>
        )
    }
    
    if (!qrCode || !payload) {
        return <p className="text-sm text-muted-foreground">Não foi possível gerar o QR Code para pagamento.</p>;
    }

    return (
        <div className="flex flex-col items-center gap-4 rounded-lg border p-6">
            <h3 className="font-semibold">Pagar com PIX</h3>
             <QRCodeCanvas
                value={qrCode}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"M"}
                includeMargin={true}
            />
            <div className="flex w-full gap-2 mt-2">
                 <Button onClick={handleCopy} variant="outline" className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Código
                </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
                Abra o aplicativo do seu banco, escolha a opção PIX, selecione "Ler QR Code" ou "Copia e Cola".
            </p>
        </div>
    );
};

export default PixQRCode;
