
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
import { uploadExternalContract } from '@/lib/actions/clients'
import { Loader2, File, CheckCircle, Upload, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface UploadInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  onUploadSuccess: () => void
}

export function UploadInvoiceModal({ isOpen, onClose, clientId, onUploadSuccess }: UploadInvoiceModalProps) {
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
        description: 'Por favor, escolha um arquivo PDF para enviar.',
      })
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    // Garante um nome de arquivo único para evitar conflitos
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`
    const filePath = `external_contracts/${clientId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('invoices') // Usando o bucket 'invoices' como definido na política de storage
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
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

    const { error: dbError } = await uploadExternalContract(clientId, publicUrl, file.name)

    setIsLoading(false)

    if (dbError) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Ativar Cliente',
        description: dbError.message,
      })
    } else {
      toast({
        title: 'Sucesso!',
        description: 'O contrato foi anexado e o cliente foi ativado para cobranças.',
        className: 'bg-green-100 border-green-200 text-green-800'
      })
      onUploadSuccess()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anexar Contrato Externo</DialogTitle>
          <DialogDescription>
            Envie um contrato em PDF para ativar as cobranças para este cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <Alert>
                <File className="h-4 w-4" />
                <AlertTitle>Ativação de Cliente</AlertTitle>
                <AlertDescription>
                   Ao anexar um contrato, um crédito será consumido e este cliente será ativado para receber cobranças recorrentes.
                </AlertDescription>
            </Alert>
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
            Anexar e Ativar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
