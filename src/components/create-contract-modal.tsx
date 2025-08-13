
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { createContract } from '@/lib/actions/contratos'
import { getClients } from '@/lib/actions/clients'
import { Loader2, PlusCircle } from 'lucide-react'
import type { Contrato, Cliente, Proposta } from '@/lib/types'
import { AddClientSheet } from './add-client-sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const contractSchema = z.object({
  clienteId: z.string({ required_error: 'Selecione um cliente.' }),
  propostaId: z.string({ required_error: 'Selecione uma proposta.' }),
})

interface CreateContractModalProps {
  isOpen: boolean
  onClose: () => void
  onContractAdded: (newContract: Contrato) => void
  clients: Cliente[]
  proposals: Proposta[]
  onClientListChange: (clients: Cliente[]) => void
  selectedClientId?: string | null;
  selectedProposalId?: string | null;
}

export function CreateContractModal({ 
    isOpen, 
    onClose, 
    onContractAdded, 
    clients, 
    proposals,
    onClientListChange,
    selectedClientId,
    selectedProposalId
}: CreateContractModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAddClientSheetOpen, setIsAddClientSheetOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<z.infer<typeof contractSchema>>({
    resolver: zodResolver(contractSchema),
  })

  useEffect(() => {
    if (selectedClientId) {
      form.setValue('clienteId', selectedClientId);
    }
    if (selectedProposalId) {
      form.setValue('propostaId', selectedProposalId);
    }
  }, [selectedClientId, selectedProposalId, form]);


  const handleFormSubmit = async (values: z.infer<typeof contractSchema>) => {
    setIsLoading(true)
    const { data, error } = await createContract(values.clienteId, values.propostaId)
    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Gerar Contrato',
        description: error.message,
      })
    } else if (data) {
      toast({
        title: 'Contrato Gerado!',
        description: 'O novo contrato foi criado com sucesso.',
      })
      onContractAdded(data);
      router.push(`/dashboard/contratos/${data.id}`);
      onClose();
      form.reset();
    }
  }
  
  const handleClientAdded = async (newClient: Cliente) => {
    const { data } = await getClients();
    if(data) {
        onClientListChange(data);
    }
    form.setValue('clienteId', newClient.id, { shouldValidate: true });
    setIsAddClientSheetOpen(false);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gerar Novo Contrato</DialogTitle>
            <DialogDescription>
              Selecione o cliente e a proposta para gerar um novo contrato.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="clienteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={client.avatar_url || ''} />
                                    <AvatarFallback className="text-xs">
                                      {(client.full_name || client.company_name || 'C').charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{client.full_name || client.company_name}</span>
                                </div>
                              </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="p-0 h-auto text-sm"
                      onClick={() => {
                        onClose(); // Close current modal before opening new one
                        setTimeout(() => setIsAddClientSheetOpen(true), 150);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Adicionar novo cliente
                    </Button>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="propostaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposta</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecione uma proposta" />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          {proposals.map(proposal => (
                              <SelectItem key={proposal.id} value={proposal.id}>
                                  {proposal.name}
                              </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Gerar e Continuar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {isAddClientSheetOpen && (
        <AddClientSheet
          isOpen={isAddClientSheetOpen}
          onClose={() => setIsAddClientSheetOpen(false)}
          onSuccess={handleClientAdded}
        />
      )}
    </>
  )
}
