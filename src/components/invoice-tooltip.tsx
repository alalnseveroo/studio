
'use client'

import { useState, useRef, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

const PdfIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto"
  >
    <path
      d="M32.5 4H11.5C10.1193 4 9 5.11929 9 6.5V41.5C9 42.8807 10.1193 44 11.5 44H36.5C37.8807 44 39 42.8807 39 41.5V11.5L32.5 4Z"
      fill="#4FC8E8"
    />
    <path d="M32.5 4V11.5H39" fill="#B1E7F5" />
    <path
      d="M20.24 30.08H18.42L17.2 32.74H15.9L18.16 27.52H19.72L21.98 32.74H20.7L20.24 30.08ZM18.52 29.24L18.06 28.16H18L17.54 29.24H18.52Z"
      fill="white"
    />
    <path
      d="M25.8 32.74H22.6V27.52H25.72C26.74 27.52 27.38 28.14 27.38 29.12C27.38 29.84 27.04 30.28 26.34 30.46L27.68 32.74H26.38L25.22 30.7H24.32V32.74H22.6V30.7H24.32V28.4H22.6V27.52H25.72V28.4H24.32V30.7H25.22L26.38 32.74H27.68L26.34 30.46C27.04 30.28 27.38 29.84 27.38 29.12C27.38 28.14 26.74 27.52 25.72 27.52H22.6V32.74H25.8Z"
      fill="white"
    />
    <path
      d="M32.2 27.52V32.74H30.48V28.4H28.76V27.52H32.2Z"
      fill="white"
    />
  </svg>
)

export function InvoiceTooltip({ charge, onUploadSuccess }: InvoiceTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !files[0]) return

    const file = files[0]
    if (file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Arquivo Inválido',
        description: 'Por favor, selecione um arquivo PDF.',
      })
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const filePath = `invoices/${charge.user_id}/${charge.id}/${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('public') // Bucket público
      .upload(filePath, file, { cacheControl: '3600', upsert: true })

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
      .from('public') // Mesmo bucket público
      .getPublicUrl(filePath)

    if (!publicUrl) {
      setIsLoading(false)
      toast({
        variant: 'destructive',
        title: 'Erro ao obter URL',
        description: 'O arquivo foi enviado, mas não foi possível obter o link público.',
      })
      return
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
          <PlusCircle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          <span className="sr-only">Anexar nota fiscal</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto bg-black text-white p-4 border-2 border-dashed border-white/50"
        align="end"
        sideOffset={8}
      >
        <div
          className="flex flex-col items-center justify-center gap-2 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {isLoading ? (
            <Loader2 className="h-12 w-12 animate-spin" />
          ) : (
            <>
              <p className="text-sm font-medium">Anexar nota fiscal</p>
              <PdfIcon />
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="application/pdf"
                disabled={isLoading}
              />
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
