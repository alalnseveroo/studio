
'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { saveInvoiceUrl } from '@/lib/actions/cobrancas'
import { Loader2, File, CheckCircle, Upload, Trash2, PlusCircle } from 'lucide-react'
import type { Cobranca } from '@/lib/types'
import Link from 'next/link'

interface InvoiceTooltipProps {
  charge: Cobranca
  onUploadSuccess: () => void
}

export function InvoiceTooltip({ charge, onUploadSuccess }: InvoiceTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files[0]) {
      if (files[0].type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Arquivo Inválido',
          description: 'Por favor, selecione um arquivo PDF.',
        })
        return
      }
      setFile(files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, escolha um arquivo para enviar.',
      })
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const filePath = `public/${charge.user_id}/${charge.id}/${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      setIsLoading(false)
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description: `Não foi possível enviar o arquivo: ${uploadError.message}`,
      })
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(filePath)
    
    if (!publicUrl) {
         setIsLoading(false)
         toast({
            variant: 'destructive',
            title: 'Erro ao obter URL',
            description: 'O arquivo foi enviado, mas não foi possível obter o link público.',
        })
        return;
    }

    const { error: dbError } = await saveInvoiceUrl(charge.id, publicUrl)

    setIsLoading(false)

    if (dbError) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: dbError.message,
      })
    } else {
      toast({
        title: 'Sucesso!',
        description: 'A nota fiscal foi anexada com sucesso.',
      })
      onUploadSuccess()
      setIsOpen(false)
    }
  }
  
  const clientName = charge.clientes?.full_name || charge.clientes?.company_name || 'Cliente';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <PlusCircle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors"/>
                    <span className="sr-only">Anexar nota fiscal</span>
                </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent className="bg-black text-white">
            <p>Anexar nota fiscal</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anexar Nota Fiscal (NF-e)</DialogTitle>
          <DialogDescription>
            Envie o arquivo PDF da nota fiscal para a cobrança de{' '}
            {clientName}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div 
            className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground"/>
                <p className="mt-2 text-sm text-muted-foreground">
                    {file ? 'Arquivo selecionado:' : 'Entregue a nota fiscal'}
                </p>
                {file && <p className="font-semibold text-sm">{file.name}</p>}
                 <p className="text-xs text-muted-foreground">
                    Clique para pegar o PDF e subir
                </p>
            </div>
            <Input 
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="application/pdf"
            />
          </div>
          {file && (
             <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                    <Trash2 className="mr-2 h-4 w-4"/>
                    Remover arquivo
                </Button>
             </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={isLoading || !file}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {charge.invoice_url ? 'Substituir NF-e' : 'Enviar NF-e'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
