
'use client'

import { useState } from 'react';
import { PixQRCode as PixQRCodeReact } from 'pix-qr-code-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

interface PixQRCodeProps {
    pixKey: string;
    value: number;
    beneficiaryName: string;
    beneficiaryCity: string;
}

const PixQRCode: React.FC<PixQRCodeProps> = ({ pixKey, value, beneficiaryName, beneficiaryCity }) => {
    const { toast } = useToast();

    if (!pixKey || value <= 0 || !beneficiaryName || !beneficiaryCity) {
        return <p className="text-sm text-muted-foreground">Não foi possível gerar o QR Code para pagamento. Verifique se os dados do contrato e da contratada estão completos.</p>;
    }
    
    const qrCodeConfig = {
        pixKey: pixKey,
        value: value,
        city: beneficiaryCity,
        name: beneficiaryName,
        transactionId: 'CONTRATO123', // Pode ser um ID único se necessário
    };
    
    const handleCopy = (brCode: string) => {
        navigator.clipboard.writeText(brCode);
        toast({
            title: "Código Copiado!",
            description: "O código PIX Copia e Cola foi copiado para a área de transferência.",
        });
    };

    return (
        <div className="flex flex-col items-center gap-4 rounded-lg border p-6">
            <h3 className="font-semibold">Pagar com PIX</h3>
             <PixQRCodeReact
                qrCode={qrCodeConfig}
                size={200}
                copyButton={{
                    show: true,
                    Component: ({ value }) => (
                         <Button onClick={() => handleCopy(value)} variant="outline" className="w-full mt-2">
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar Código (Copia e Cola)
                        </Button>
                    ),
                }}
            />
            <p className="text-center text-sm text-muted-foreground mt-2">
                Abra o aplicativo do seu banco, escolha a opção PIX, selecione "Ler QR Code" ou "Copia e Cola".
            </p>
        </div>
    );
};

export default PixQRCode;
