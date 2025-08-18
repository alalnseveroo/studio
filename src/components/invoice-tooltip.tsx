
'use client'

import { useState, useRef } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { saveInvoiceUrl } from '@/lib/actions/cobrancas'
import { Loader2, Upload, Trash2, PlusCircle } from 'lucide-react'
import type { Cobranca } from '@/lib/types'

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
      setFile(null);
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <PlusCircle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors"/>
                    <span className="sr-only">Anexar nota fiscal</span>
                </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="bg-black text-white border-black">
            <p>Anexar nota fiscal</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-80 bg-black text-white border-black" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Entregar nota fiscal</h4>
          </div>
           <div 
            className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400"/>
                <p className="mt-1 text-sm text-gray-400">
                  {file ? file.name : 'Clique para pegar o PDF'}
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
             <div className="flex justify-end -mt-2">
                <Button variant="link" size="sm" className="h-auto py-1 px-2 text-xs text-red-400 hover:text-red-500" onClick={() => setFile(null)}>
                    <Trash2 className="mr-1 h-3 w-3"/>
                    Remover
                </Button>
             </div>
          )}
           <Button onClick={handleUpload} disabled={isLoading || !file} variant="secondary" className="bg-white text-black hover:bg-gray-200">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {charge.invoice_url ? 'Substituir NF-e' : 'Enviar NF-e'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
