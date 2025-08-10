
'use client'

import * as React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { createFullClient } from '@/lib/actions/clients'
import { Loader2, UserRound, Banknote, ClipboardCheck } from 'lucide-react'
import type { Cliente, Proposta } from '@/lib/types'
import { Stepper, Step, StepLabel } from '@/components/ui/stepper'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from './ui/calendar'
import { format } from 'date-fns'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { cn } from '@/lib/utils'
import { getProposals } from '@/lib/actions/propostas'

const clientInfoSchema = z.object({
  fullName: z.string().min(3, { message: 'O nome completo é obrigatório.' }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  phone: z.string().optional(),
  document: z.string().optional(),
});

const billingSchema = z.object({
    proposalId: z.string().optional(),
    value: z.string().min(1, { message: "O valor é obrigatório."}),
    paymentDay: z.string().min(1, { message: "O dia da cobrança é obrigatório." }),
    firstChargeDate: z.date({ required_error: "A data da primeira cobrança é obrigatória."}),
    firstChargeAction: z.enum(['auto', 'manual'], { required_error: "Selecione a ação da primeira cobrança."}),
    description: z.string().optional(),
});

const fullSchema = clientInfoSchema.merge(billingSchema);

type WizardFormData = z.infer<typeof fullSchema>;

const steps = [
  { id: 'cliente', label: 'Cliente', icon: UserRound },
  { id: 'cobranca', label: 'Cobrança', icon: Banknote },
  { id: 'revisao', label: 'Revisão', icon: ClipboardCheck },
]

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: (newClient: Cliente) => void
}

export function AddClientModal({ isOpen, onClose, onClientAdded }: AddClientModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [proposals, setProposals] = useState<Proposta[]>([]);
  const { toast } = useToast()

  const form = useForm<WizardFormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      document: '',
      proposalId: '',
      value: '',
      paymentDay: '',
      description: '',
      firstChargeAction: 'manual',
    },
  })
  
  const selectedProposalId = form.watch('proposalId');

  React.useEffect(() => {
    async function loadProposals() {
        const { data } = await getProposals();
        setProposals(data || []);
    }
    if (isOpen) {
        loadProposals();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (selectedProposalId) {
        const selected = proposals.find(p => p.id === selectedProposalId);
        if (selected) {
            form.setValue('value', selected.value?.toString() || '');
            form.setValue('paymentDay', selected.payment_day?.toString() || '');
            form.setValue('description', selected.services.join(', '));
        }
    }
  }, [selectedProposalId, proposals, form]);

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof WizardFormData)[] = [];
    if (currentStep === 0) fieldsToValidate = ['fullName', 'email'];
    if (currentStep === 1) fieldsToValidate = ['value', 'paymentDay', 'firstChargeDate', 'firstChargeAction'];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1)
  }
  
  const onSubmit = async (values: WizardFormData) => {
    setIsLoading(true);
    const { data, error } = await createFullClient(values);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Adicionar Cliente',
        description: error.message,
      })
    } else if (data) {
      toast({
        title: 'Cliente Adicionado!',
        description: `A cobrança para ${data.full_name} foi configurada.`,
        className: 'bg-green-100 border-green-200 text-green-800'
      })
      onClientAdded(data);
      handleClose();
    }
  }

  const handleClose = () => {
    form.reset();
    setCurrentStep(0);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Onboarding de Novo Cliente</DialogTitle>
          <DialogDescription>
            Siga os passos para cadastrar e configurar a cobrança do seu cliente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
            <Stepper activeStep={currentStep}>
                {steps.map((step, index) => (
                    <Step key={step.id} index={index}>
                        <StepLabel icon={step.icon}>{step.label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {currentStep === 0 && <ClientStep form={form} />}
            {currentStep === 1 && <BillingStep form={form} proposals={proposals} />}
            {currentStep === 2 && <ReviewStep form={form} proposals={proposals} />}

            <div className="flex justify-end gap-4 pt-4">
              {currentStep > 0 && (
                <Button type="button" variant="ghost" onClick={handlePrevStep}>
                  Voltar
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button type="button" onClick={handleNextStep}>
                  {currentStep === 0 ? 'Salvar e ir para Cobrança' : 'Revisar Configuração'}
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                 <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ativar Cobrança Automática
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ETAPA 1: CLIENTE
function ClientStep({ form }: { form: any }) {
    return (
        <div className="space-y-4 animate-in fade-in-50 duration-500">
            <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome do cliente" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="email@cliente.com" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Telefone / WhatsApp (Opcional)</FormLabel><FormControl><Input placeholder="(99) 99999-9999" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="document" render={({ field }) => (
                    <FormItem><FormLabel>CPF/CNPJ (Opcional)</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
        </div>
    )
}

// ETAPA 2: COBRANÇA
function BillingStep({ form, proposals }: { form: any, proposals: Proposta[] }) {
    const clientName = form.watch('fullName');
    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
             <div>
                <FormLabel>Qual plano de serviço você vai usar para '{clientName}'?</FormLabel>
                <FormField
                    control={form.control}
                    name="proposalId"
                    render={({ field }) => (
                    <FormItem className="mt-2">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma Proposta Pré-Definida" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {proposals.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>Ou configure uma cobrança avulsa preenchendo os campos abaixo.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}/>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="value" render={({ field }) => (
                    <FormItem><FormLabel>Valor para este cliente (R$)</FormLabel><FormControl><Input type="number" placeholder="1500.00" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="paymentDay" render={({ field }) => (
                    <FormItem><FormLabel>Dia da Cobrança</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Input placeholder="Serviços incluídos na cobrança" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            
            <div className="space-y-4 rounded-md border p-4">
                <h4 className="font-medium">Controle da Automação</h4>
                <FormField control={form.control} name="firstChargeDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Quando realizar a primeira cobrança?</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Escolha uma data</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="firstChargeAction" render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>A primeira cobrança deve:</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="manual" /></FormControl>
                                    <FormLabel className="font-normal">Aguardar minha aprovação manual</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="auto" /></FormControl>
                                    <FormLabel className="font-normal">Ser enviada automaticamente</FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                 )}/>
            </div>
        </div>
    )
}

// ETAPA 3: REVISÃO
function ReviewStep({ form, proposals }: { form: any, proposals: Proposta[] }) {
    const values = form.getValues();
    const selectedProposal = proposals.find(p => p.id === values.proposalId);
    
    const InfoRow = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            <h3 className="text-lg font-semibold text-center">Revise e Confirme a Automação para '{values.fullName}'</h3>
            <div className="space-y-4 rounded-md border p-4">
                 <InfoRow label="Plano Base" value={selectedProposal?.name || 'Cobrança Avulsa'} />
                 <InfoRow label="Valor Final" value={`R$ ${Number(values.value).toFixed(2)}`} />
                 <InfoRow label="Ciclo de Cobrança" value={`Todo dia ${values.paymentDay}, mensalmente.`} />
                 <InfoRow label="Primeira Cobrança pelo Sistema" value={values.firstChargeDate ? format(values.firstChargeDate, 'dd/MM/yyyy') : 'Data não definida'} />
                 <InfoRow label="Ação da Primeira Cobrança" value={values.firstChargeAction === 'manual' ? 'Aguardando sua aprovação para envio' : 'Envio automático'} />
                 <InfoRow label="Cliente" value={`${values.fullName} (${values.email})`} />
            </div>
        </div>
    )
}
