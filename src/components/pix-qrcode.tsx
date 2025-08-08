
'use client'

import { useState, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, RefreshCw } from 'lucide-react';

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
    const [transactionId, setTransactionId] = useState('***');

    const generateNewCode = useCallback(() => {
        if (pixKey && value > 0 && beneficiaryName && beneficiaryCity) {
            // Gera um ID de transação mais único, pode ser melhorado se necessário
            const newTxId = `TX${Date.now()}`.substring(0, 25);
            setTransactionId(newTxId);
            const code = generateBRCode(
                pixKey,
                value,
                beneficiaryName,
                beneficiaryCity,
                newTxId,
            );
            setBrCode(code);
        }
    }, [pixKey, value, beneficiaryName, beneficiaryCity]);

    useEffect(() => {
        // Gera o código inicial na primeira renderização
        generateNewCode();
    }, [generateNewCode]);
    

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
            <div className="flex w-full gap-2 mt-2">
                 <Button onClick={handleCopy} variant="outline" className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Código
                </Button>
                <Button onClick={generateNewCode} variant="secondary" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Gerar Novo Código
                </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
                Abra o aplicativo do seu banco, escolha a opção PIX, selecione "Ler QR Code" ou "Copia e Cola".
            </p>
        </div>
    );
};

export default PixQRCode;
