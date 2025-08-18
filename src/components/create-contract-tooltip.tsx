"use client"

import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { FileSignature, PlusCircle } from 'lucide-react'
import type { Cliente } from '@/lib/types'

interface CreateContractTooltipProps {
  client: Cliente
  onOpenCreateContractModal: () => void
}

const ContractIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 13H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 17H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 9H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)


export function CreateContractTooltip({ client, onOpenCreateContractModal }: CreateContractTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => {
    setIsOpen(false); // Fecha o popover
    onOpenCreateContractModal(); // Abre o modal
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
          <PlusCircle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          <span className="sr-only">Gerar contrato</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto bg-black text-white p-4 border-2 border-dashed border-white/50"
        align="end"
        sideOffset={8}
      >
        <div
          className="flex flex-col items-center justify-center gap-2 cursor-pointer"
          onClick={handleOpen}
        >
          <p className="text-sm font-medium">Gerar novo contrato</p>
          <ContractIcon />
           <Button variant="outline" size="sm" className="mt-2 bg-transparent text-white hover:bg-white hover:text-black">
                Criar Contrato
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
