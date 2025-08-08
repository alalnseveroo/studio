
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

const generateBRCode = (
    pixKey: string,
    value: number,
    beneficiaryName: string,
    beneficiaryCity: string,
    transactionId: string
): string => {
    beneficiaryName = beneficiaryName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
    beneficiaryCity = beneficiaryCity.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15);
    transactionId = transactionId.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);

    const formatField = (id: string, val: string) => {
        const len = val.length.toString().padStart(2, '0');
        return `${id}${len}${val}`;
    };

    const merchantAccountInfo = [
        formatField('00', 'br.gov.bcb.pix'),
        formatField('01', pixKey)
    ].join('');

    const payload = [
        formatField('00', '01'),
        formatField('26', merchantAccountInfo),
        formatField('52', '0000'),
        formatField('53', '986'),
        formatField('54', value.toFixed(2)),
        formatField('58', 'BR'),
        formatField('59', beneficiaryName),
        formatField('60', beneficiaryCity),
        formatField('62', formatField('05', transactionId)),
    ].join('');

    const payloadWithCrcPlaceholder = `${payload}6304`;

    // CRC16 Calculation
    let crc = 0xFFFF;
    for (let i = 0; i < payloadWithCrcPlaceholder.length; i++) {
        crc ^= (payloadWithCrcPlaceholder.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }
    const crcValue = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');

    return `${payloadWithCrcPlaceholder}${crcValue}`;
};


const PixQRCode: React.FC<PixQRCodeProps> = ({ pixKey, value, beneficiaryName, beneficiaryCity }) => {
    const { toast } = useToast();
    const [brCode, setBrCode] = useState('');

    useEffect(() => {
        if (pixKey && value > 0 && beneficiaryName && beneficiaryCity) {
             const code = generateBRCode(
                pixKey,
                value,
                beneficiaryName,
                beneficiaryCity,
                '***', // Conforme especificação, pode ser '***'
            );
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

