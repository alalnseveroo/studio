
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
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { updateClientFinancials } from '@/lib/actions/clients'
import { Loader2 } from 'lucide-react'
import type { Proposta } from '@/lib/types'

const billingSchema = z.object({
  proposal_id: z.string().nullable(),
  value: z.coerce.number().min(1, { message: 'O valor deve ser maior que zero.'}),
  payment_day: z.coerce.number().min(1, 'O dia do vencimento é obrigatório.').max(31, 'Dia inválido.'),
  first_charge_date: z.string().optional(),
  billing_status: z.enum(['active', 'inactive']),
  send_charge_now: z.boolean().default(false).optional(),
})

type BillingFormData = z.infer<typeof billingSchema>;

interface ConfigureBillingModalProps {
  isOpen: boolean
  onClose: () => void
  onBillingConfigured: () => void
  clientId: string | null
  proposals: Proposta[]
}

export function ConfigureBillingModal({ 
    isOpen, 
    onClose, 
    onBillingConfigured, 
    clientId, 
    proposals,
}: ConfigureBillingModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
        proposal_id: null,
        value: undefined, 
        payment_day: undefined,
        first_charge_date: '',
        billing_status: 'active',
        send_charge_now: false,
    }
  })

  const selectedProposalId = form.watch('proposal_id');

  useEffect(() => {
    if (isOpen) {
        form.reset({
             proposal_id: null,
            value: undefined,
            payment_day: undefined,
            first_charge_date: '',
            billing_status: 'active',
            send_charge_now: false,
        });
    }
  }, [isOpen, form]);

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
    if (!clientId) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum cliente selecionado.'})
        return;
    };
    setIsLoading(true)
    const { error } = await updateClientFinancials(clientId, values)
    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Configurar Cobrança',
        description: error.message,
      })
    } else {
      toast({
        title: 'Cobrança Configurada!',
        description: 'A cobrança recorrente foi salva com sucesso.',
      })
      onBillingConfigured();
      onClose();
    }
  }

  return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Cobrança Recorrente</DialogTitle>
            <DialogDescription>
              Defina os detalhes da cobrança para este cliente.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
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
                              <SelectValue placeholder="Selecione uma proposta" />
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
                            <FormLabel>Valor da Mensalidade (R$)</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="1500.00" {...field} value={field.value ?? ''} /></FormControl>
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
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
              <FormField
                control={form.control}
                name="billing_status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel>Ativar Cobrança Automática</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value === 'active'}
                        onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="send_charge_now"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Enviar cobrança agora?</FormLabel>
                      <FormDescription className="text-xs">
                        Uma fatura com vencimento para hoje será gerada.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Configuração
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  )
}
