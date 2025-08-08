
'use client'

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

interface PixQRCodeProps {
    pixKey: string;
    value: number;
    beneficiaryName: string;
    beneficiaryCity: string;
}

const generateBRCode = ({ pixKey, value, beneficiaryName, beneficiaryCity, transactionId }: {
    pixKey: string;
    value: number;
    beneficiaryName: string;
    beneficiaryCity: string;
    transactionId: string;
}) => {
    const formatValue = (fieldId: string, value: string) => {
        const length = value.length.toString().padStart(2, '0');
        return `${fieldId}${length}${value}`;
    };

    const payload = [
        formatValue('00', '01'), // Payload Format Indicator
        formatValue('26', 
            formatValue('00', 'br.gov.bcb.pix') + // GUI
            formatValue('01', pixKey) // Chave PIX
        ),
        formatValue('52', '0000'), // Merchant Category Code
        formatValue('53', '986'), // Transaction Currency (BRL)
        formatValue('54', value.toFixed(2)), // Transaction Amount
        formatValue('58', 'BR'), // Country Code
        formatValue('59', beneficiaryName.substring(0, 25)), // Merchant Name
        formatValue('60', beneficiaryCity.substring(0, 15)), // Merchant City
        formatValue('62', 
            formatValue('05', transactionId.substring(0, 25)) // Transaction ID
        ),
    ];

    const payloadString = payload.join('');
    const crc16 = (data: string) => {
        let crc = 0xFFFF;
        for (let i = 0; i < data.length; i++) {
            crc ^= data.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
            }
        }
        return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    };

    const fullPayload = `${payloadString}6304`;
    const finalCrc = crc16(fullPayload);
    
    return `${fullPayload}${finalCrc}`;
};


const PixQRCode: React.FC<PixQRCodeProps> = ({ pixKey, value, beneficiaryName, beneficiaryCity }) => {
    const { toast } = useToast();
    const [brCode, setBrCode] = useState('');

    useEffect(() => {
        if (pixKey && value > 0 && beneficiaryName && beneficiaryCity) {
             const code = generateBRCode({
                pixKey: pixKey,
                value: value,
                beneficiaryName: beneficiaryName,
                beneficiaryCity: beneficiaryCity,
                transactionId: '***', // Conforme especificação, pode ser '***'
            });
            setBrCode(code);
        }
    }, [pixKey, value, beneficiaryName, beneficiaryCity]);
    

    if (!brCode) {
        return <p className="text-sm text-muted-foreground">Não foi possível gerar o QR Code para pagamento. Verifique se os dados do contrato e da contratada estão completos.</p>;
    }
    
    const handleCopy = () => {
        navigator.clipboard.writeText(brCode);
        toast({
            title: "Código Copiado!",
            description: "O código PIX Copia e Cola foi copiado para a área de transferência.",
        });
    };

    return (
        <div className="flex flex-col items-center gap-4 rounded-lg border p-6">
            <h3 className="font-semibold">Pagar com PIX</h3>
             <QRCodeCanvas
                value={brCode}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                includeMargin={false}
            />
            <Button onClick={handleCopy} variant="outline" className="w-full mt-2">
                <Copy className="mr-2 h-4 w-4" />
                Copiar Código (Copia e Cola)
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-2">
                Abra o aplicativo do seu banco, escolha a opção PIX, selecione "Ler QR Code" ou "Copia e Cola".
            </p>
        </div>
    );
};

export default PixQRCode;
