
'use client'

import { useState, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, RefreshCw, Loader2 } from 'lucide-react';
import { getAsaasPixCharge } from '@/lib/asaas';

interface PixQRCodeProps {
    paymentId: string;
}

const PixQRCode: React.FC<PixQRCodeProps> = ({ paymentId }) => {
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
