
'use client'

import { useState, useEffect } from 'react';
import { getAsaasPixCharge } from '@/lib/asaas';
import Image from 'next/image';
import { Button } from './ui/button';
import { Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface PixQRCodeProps {
    paymentId: string;
}

export function PixQRCode({ paymentId }: PixQRCodeProps) {
    const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
    const [payload, setPayload] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchQrCode = async () => {
            setIsLoading(true);
            setError(null);
            const { qrCode, payload, error: apiError } = await getAsaasPixCharge(paymentId);

            if (apiError) {
                setError(apiError.message);
            } else {
                setQrCodeImage(qrCode);
                setPayload(payload);
            }
            setIsLoading(false);
        };

        if (paymentId) {
            fetchQrCode();
        }
    }, [paymentId]);
    
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

    if (error) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro ao Carregar PIX</AlertTitle>
                <AlertDescription>
                    Não foi possível obter o QR Code. Por favor, tente novamente mais tarde.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            {qrCodeImage && (
                 <div className="p-2 bg-white rounded-lg border">
                    <Image
                        src={`data:image/png;base64,${qrCodeImage}`}
                        alt="PIX QR Code"
                        width={220}
                        height={220}
                    />
                </div>
            )}
            {payload && (
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
            )}
        </div>
    )
}
