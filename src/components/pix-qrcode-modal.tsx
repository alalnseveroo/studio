
'use client'

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Copy, Check } from 'lucide-react'
import Image from 'next/image';
import { Badge } from './ui/badge';

export interface PixData {
  qrCodeImage: string;
  payload: string;
  value: number;
}

interface PixQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixData: PixData;
}

export function PixQRCodeModal({ isOpen, onClose, pixData }: PixQRCodeModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(pixData.payload);
    setIsCopied(true);
    toast({
      title: "Código Copiado!",
      description: "O código PIX Copia e Cola foi copiado para a área de transferência.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Pague com PIX</DialogTitle>
          <DialogDescription className="text-center">
            Abra o app do seu banco e escaneie o QR Code ou use o código abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-2 bg-white rounded-lg border">
            <Image
              src={`data:image/png;base64,${pixData.qrCodeImage}`}
              alt="PIX QR Code"
              width={220}
              height={220}
            />
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            Valor: R$ {pixData.value.toFixed(2).replace('.', ',')}
          </Badge>
          <div className="w-full space-y-2">
            <p className="text-sm font-medium text-center">PIX Copia e Cola</p>
            <div className="relative">
              <textarea
                readOnly
                value={pixData.payload}
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
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Pagamento Realizado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
