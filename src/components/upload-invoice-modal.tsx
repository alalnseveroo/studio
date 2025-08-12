
'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { saveInvoiceUrl } from '@/lib/actions/cobrancas'
import { Loader2, File, CheckCircle, Upload, Trash2 } from 'lucide-react'
import type { Cobranca } from '@/lib/types'
import Link from 'next/link'

interface UploadInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  charge: Cobranca
  onUploadSuccess: () => void
}

export function UploadInvoiceModal({ isOpen, onClose, charge, onUploadSuccess }: UploadInvoiceModalProps) {
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
        upsert: true, // Substitui o arquivo se já existir um com o mesmo nome
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
        description: `Não foi possível salvar o link da nota fiscal no banco de dados: ${dbError.message}`,
      })
    } else {
      toast({
        title: 'Sucesso!',
        description: 'A nota fiscal foi anexada com sucesso.',
      })
      onUploadSuccess()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anexar Nota Fiscal (NF-e)</DialogTitle>
          <DialogDescription>
            Envie o arquivo PDF da nota fiscal para a cobrança de{' '}
            {charge.clientes.full_name || charge.clientes.company_name}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {charge.invoice_url ? (
             <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Nota Fiscal Anexada</AlertTitle>
                <AlertDescription className="text-green-700">
                    Já existe uma nota fiscal para esta cobrança. Você pode visualizá-la ou substituí-la abaixo.
                    <Button asChild variant="link" size="sm" className="p-0 h-auto ml-2">
                        <Link href={charge.invoice_url} target="_blank" rel="noopener noreferrer">Ver NF-e atual</Link>
                    </Button>
                </AlertDescription>
             </Alert>
          ) : (
            <Alert>
                <File className="h-4 w-4" />
                <AlertTitle>Nenhuma NF-e Anexada</AlertTitle>
                <AlertDescription>
                    Selecione o arquivo PDF da nota fiscal para enviá-lo.
                </AlertDescription>
            </Alert>
          )}

          <div 
            className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground"/>
                <p className="mt-2 text-sm text-muted-foreground">
                    {file ? 'Arquivo selecionado:' : 'Clique para selecionar o arquivo PDF'}
                </p>
                {file && <p className="font-semibold text-sm">{file.name}</p>}
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
          <Button variant="ghost" onClick={onClose}>
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
