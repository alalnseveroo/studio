
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
    // Normaliza e limita o tamanho dos campos de texto
    const sanitize = (text: string, maxLength: number) => {
        return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .replace(/[^a-zA-Z0-9 ]/g, '') // Remove caracteres especiais exceto espaço
            .substring(0, maxLength)
            .trim();
    };

    beneficiaryName = sanitize(beneficiaryName, 25);
    beneficiaryCity = sanitize(beneficiaryCity, 15);
    transactionId = sanitize(transactionId, 25).replace(/\s/g, ''); // TxID não pode ter espaços

    const formatField = (id: string, val: string) => {
        const len = val.length.toString().padStart(2, '0');
        return `${id}${len}${val}`;
    };
    
    // Montagem dos campos do BRCode
    const payload = [
        formatField('00', '01'), // Payload Format Indicator
        formatField('26', // Merchant Account Information
            formatField('00', 'br.gov.bcb.pix') + // GUI
            formatField('01', pixKey) // Chave PIX
        ),
        formatField('52', '0000'), // Merchant Category Code
        formatField('53', '986'), // Transaction Currency (BRL)
        formatField('54', value.toFixed(2)), // Transaction Amount
        formatField('58', 'BR'), // Country Code
        formatField('59', beneficiaryName), // Merchant Name
        formatField('60', beneficiaryCity), // Merchant City
        formatField('62', // Additional Data Field Template
            formatField('05', transactionId) // Reference Label (txid)
        ),
    ].join('');

    const payloadWithCrcPlaceholder = `${payload}6304`;
    
    // Cálculo do CRC16-CCITT
    let crc = 0xFFFF;
    for (let i = 0; i < payloadWithCrcPlaceholder.length; i++) {
        crc ^= payloadWithCrcPlaceholder.charCodeAt(i) << 8;
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
                level={"M"}
                includeMargin={true}
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
