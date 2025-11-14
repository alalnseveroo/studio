

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
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
  FormDescription,
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
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { updateClientFinancials } from '@/lib/actions/clients'
import { Loader2, PlusCircle } from 'lucide-react'
import type { Proposta, Cliente } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Info } from 'lucide-react'

const billingSchema = z.object({
  clienteId: z.string({ required_error: 'É necessário selecionar um cliente.' }),
  proposal_id: z.string().nullable(),
  value: z.coerce.number().min(1, { message: 'O valor deve ser maior que zero.'}),
  payment_day: z.coerce.number().min(1, 'O dia do vencimento é obrigatório.').max(31, 'Dia inválido.'),
  first_charge_date: z.string().optional(),
})

type BillingFormData = z.infer<typeof billingSchema>;

interface ConfigureBillingModalProps {
  isOpen: boolean
  onClose: () => void
  onBillingConfigured: () => void
  clientId: string | null
  clients: Cliente[]
  proposals: Proposta[]
}

export function ConfigureBillingModal({ 
    isOpen, 
    onClose, 
    onBillingConfigured, 
    clientId, 
    clients,
    proposals,
}: ConfigureBillingModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
        clienteId: clientId || undefined,
        proposal_id: null,
        value: 0, 
        payment_day: 0,
        first_charge_date: '',
    }
  })

  useEffect(() => {
    if (isOpen) {
        form.reset({
            clienteId: clientId || undefined,
            proposal_id: null,
            value: 0,
            payment_day: 0,
            first_charge_date: '',
        });
    }
  }, [isOpen, clientId, form]);

  const selectedProposalId = form.watch('proposal_id');

  useEffect(() => {
    if (selectedProposalId) {
        const proposal = proposals.find(p => p.id === selectedProposalId);
        if (proposal) {
            if (proposal.value) form.setValue('value', proposal.value);
            if (proposal.payment_day) form.setValue('payment_day', proposal.payment_day);
        }
    }
  }, [selectedProposalId, proposals, form]);


  const handleFormSubmit = async (values: BillingFormData) => {
    setIsLoading(true);
    
    const result = await updateClientFinancials(values.clienteId, {
        ...values,
    });
    
    setIsLoading(false);

    if (result.error) {
       if (result.error.message.includes('Créditos insuficientes')) {
            onClose();
            router.push('/dashboard/settings/buy-credits');
       } else {
            toast({
                variant: 'destructive',
                title: 'Erro ao Configurar Cobrança',
                description: result.error.message,
            })
       }
    } else {
      toast({
        title: 'Cobrança Configurada!',
        description: 'A cobrança foi salva e a primeira fatura será gerada na data definida.',
      })
      onBillingConfigured();
      onClose();
    }
  }
  
  const selectedClient = clients.find(c => c.id === form.watch('clienteId'));

  return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Cobrança Recorrente</DialogTitle>
            <DialogDescription>
              Defina os detalhes da cobrança. A primeira fatura será gerada na data especificada.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              
              {selectedClient?.billing_status !== 'active' && (
                  <Alert variant="destructive">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Cliente Inativo</AlertTitle>
                      <AlertDescription>
                          Para gerar cobranças, primeiro ative este cliente anexando um contrato na aba 'Contratos' do perfil dele.
                      </AlertDescription>
                  </Alert>
              )}

              <FormField
                control={form.control}
                name="clienteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} disabled={!!clientId}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proposal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vincular Proposta (Opcional)</FormLabel>
                     <Select 
                        onValueChange={(value) => field.onChange(value === 'null-value' ? null : value)} 
                        value={field.value ?? 'null-value'}
                     >
                      <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecione para preencher valores" />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="null-value">Nenhuma</SelectItem>
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
                <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor da Cobrança (R$)</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="1500,00" {...field} value={field.value ?? ''} /></FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="payment_day"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dia do Vencimento</FormLabel>
                                <FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''}/></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="first_charge_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data da 1ª Cobrança</FormLabel>
                                <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                                <FormDescription className="text-xs">Se deixado em branco, usa a data de hoje.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
              
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={isLoading || selectedClient?.billing_status !== 'active'}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar e Criar Cobrança
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  )
}
