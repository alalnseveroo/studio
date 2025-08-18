
'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { saveInvoiceUrl } from '@/lib/actions/cobrancas'
import { Loader2, Upload, PlusCircle } from 'lucide-react'
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
    if (!file) return;

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
  
  useEffect(() => {
    if (file) {
      handleUpload();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
            <PlusCircle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors"/>
            <span className="sr-only">Anexar nota fiscal</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto bg-black text-white border-black p-0" align="end">
          <div 
            className="flex items-center justify-center w-full p-3 gap-2 cursor-pointer hover:bg-gray-800/50 rounded-md"
            onClick={() => fileInputRef.current?.click()}
          >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin"/>
            ) : (
                <Upload className="h-4 w-4"/>
            )}
            <span className="text-sm font-medium">Anexar nota fiscal</span>
            <Input 
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="application/pdf"
            />
          </div>
      </PopoverContent>
    </Popover>
  )
}
