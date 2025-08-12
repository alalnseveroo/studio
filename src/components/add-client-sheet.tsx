
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AnimatePresence, motion } from "framer-motion"
import { Check, CreditCard, FileText, ArrowRight, Loader2, Search, User, Settings, ArrowLeft } from "lucide-react"
import { addDays, format, setDate } from 'date-fns';

import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Cliente, Proposta } from "@/lib/types"
import { getProposals } from "@/lib/actions/propostas"
import { createFullClient } from "@/lib/actions/clients"
import { useToast } from "@/hooks/use-toast"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Stepper, Step, StepLabel } from "@/components/ui/stepper"


// Step Management
type StepId = "selection" | "identification" | "configuration" | "review";

const identificationSchema = z.object({
  fullName: z.string().min(3, { message: 'O nome completo é obrigatório.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  document: z.string().min(14, { message: 'O CPF/CNPJ deve ser válido.' }),
  phone: z.string().min(14, { message: 'O telefone é obrigatório.' }),
});

const configurationSchema = z.object({
  proposalId: z.string({ required_error: "Selecione uma proposta."}),
  value: z.string().min(1, { message: "O valor é obrigatório." }),
  paymentDay: z.string().min(1, { message: "O dia do pagamento é obrigatório."}),
  firstChargeDate: z.date({ required_error: "A data da primeira cobrança é obrigatória."}),
  firstChargeAction: z.enum(['auto', 'manual']),
});


type IdentificationFormData = z.infer<typeof identificationSchema>;
type ConfigurationFormData = z.infer<typeof configurationSchema>;


export function AddClientSheet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [activeStep, setActiveStep] = React.useState<StepId>("identification")
  const [proposals, setProposals] = React.useState<Proposta[]>([])
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter()
  const { toast } = useToast()
  
  // Forms for each step
  const identificationForm = useForm<IdentificationFormData>({
    resolver: zodResolver(identificationSchema),
    defaultValues: { fullName: '', email: '', document: '', phone: '' },
    mode: 'onBlur'
  });

  const configurationForm = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: { proposalId: undefined, value: '', paymentDay: undefined, firstChargeDate: undefined, firstChargeAction: 'manual' },
    mode: 'onBlur'
  });

  React.useEffect(() => {
    if (isOpen) {
        async function fetchProposalsData() {
            const { data } = await getProposals();
            if (data) setProposals(data);
        }
        fetchProposalsData();
        // Reset state when sheet opens
        setActiveStep("identification")
        identificationForm.reset();
        configurationForm.reset();
    }
  }, [isOpen, identificationForm, configurationForm]);

  const handleIdentificationSubmit = () => {
    setActiveStep("configuration");
  }

  const handleConfigurationSubmit = async (configValues: ConfigurationFormData) => {
    const identValues = identificationForm.getValues();
    const finalData = { ...identValues, ...configValues };
    
    setIsLoading(true);
    const { data, error } = await createFullClient(finalData);
    setIsLoading(false);

    if (error) {
        toast({ variant: 'destructive', title: 'Erro ao Criar Cliente', description: error.message });
    } else {
        toast({ title: 'Cliente Criado!', description: 'O novo cliente e a cobrança foram configurados com sucesso.' });
        onClose(); // Close the sheet on success
        router.push(`/dashboard/clientes/${data.id}`);
    }
  };

  const renderContent = () => {
      switch(activeStep) {
          case "configuration":
              return <ConfigurationStep form={configurationForm} proposals={proposals} onBack={() => setActiveStep("identification")} onSubmit={handleConfigurationSubmit} isLoading={isLoading} />
          case "identification":
          default:
              return <IdentificationStep form={identificationForm} onSubmit={handleIdentificationSubmit} toast={toast} />
      }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className={cn("p-0 bg-white sm:max-w-2xl")}>
        <div className="border-b p-6">
            <Stepper activeStep={activeStep === 'identification' ? 0 : 1}>
                <Step>
                    <StepLabel icon={User}>Identificação</StepLabel>
                </Step>
                <Step>
                    <StepLabel icon={Settings}>Configuração</StepLabel>
                </Step>
                 <Step>
                    <StepLabel icon={Check}>Revisão</StepLabel>
                </Step>
            </Stepper>
        </div>
        {renderContent()}
      </SheetContent>
    </Sheet>
  )
}

// ----- Sub-components for the Sheet -----

function IdentificationStep({ form, onSubmit, toast }: { form: any, onSubmit: (values: IdentificationFormData) => void, toast: any }) {
    const [isFetching, setIsFetching] = React.useState(false);
    
    const formatDocument = (value: string | null | undefined) => {
        const digits = (value || '').replace(/\D/g, '');
        if (digits.length <= 11) { // CPF
            return digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14);
        } else { // CNPJ
            return digits.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d)/, "$1-$2").substring(0, 18);
        }
    };
    const formatPhone = (value: string | null | undefined) => (value || '').replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);

    const handleDocumentSearch = async () => {
        const doc = form.getValues('document')?.replace(/\D/g, '');
        if (!doc || (doc.length !== 11 && doc.length !== 14)) {
            toast({ variant: 'destructive', title: 'Documento Inválido' });
            return;
        }
        
        if (doc.length === 11) {
             toast({ title: 'Aviso', description: 'Busca de dados por CPF não é suportada.' });
             return;
        }

        setIsFetching(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${doc}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Não foi possível buscar os dados do CNPJ.');
            form.setValue('fullName', data.razao_social, { shouldValidate: true });
            form.setValue('email', data.email, { shouldValidate: true });
            toast({ title: 'Sucesso!', description: 'Dados da empresa preenchidos.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao buscar CNPJ', description: error.message });
        } finally {
            setIsFetching(false);
        }
    };
    
    return (
        <>
            <FormProvider {...form}>
                <SheetHeader className="text-left border-b px-6 pt-4 pb-2">
                    <SheetTitle>Primeiro, os dados da pessoa de contato.</SheetTitle>
                    <SheetDescription>Esta pessoa será a responsável principal pela comunicação e pagamentos.</SheetDescription>
                </SheetHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[calc(100%-145px)]">
                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                        <FormField control={form.control} name="fullName" render={({ field }) => (
                            <FormItem><FormLabel>Nome completo / Razão Social</FormLabel><FormControl><Input placeholder="Ex: Maria da Silva" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>E-mail de contato</FormLabel><FormControl><Input type="email" placeholder="maria.silva@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="document" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CPF / CNPJ</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <FormControl><Input placeholder="000.000.000-00" {...field} onChange={e => field.onChange(formatDocument(e.target.value))} value={field.value || ''} /></FormControl>
                                        <Button type="button" size="icon" variant="outline" onClick={handleDocumentSearch} disabled={isFetching}>{isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Contato (Telefone/WhatsApp)</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} onChange={e => field.onChange(formatPhone(e.target.value))} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    </div>
                     <SheetFooter className="border-t p-6 flex justify-end">
                        <Button type="submit">
                            Ir para Configuração <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </SheetFooter>
                </form>
            </FormProvider>
        </>
    )
}


function ConfigurationStep({ form, proposals, onBack, onSubmit, isLoading }: { form: any, proposals: Proposta[], onBack: () => void, onSubmit: (values: ConfigurationFormData) => void, isLoading: boolean }) {
    
    const selectedProposalId = form.watch('proposalId');

    React.useEffect(() => {
        if (selectedProposalId) {
            const proposal = proposals.find(p => p.id === selectedProposalId);
            if (proposal) {
                form.setValue('value', proposal.value?.toFixed(2) || '0.00', { shouldValidate: true });
                if (proposal.payment_day) {
                    form.setValue('paymentDay', String(proposal.payment_day), { shouldValidate: true });
                    
                    const today = new Date();
                    let nextChargeDate = setDate(new Date(), proposal.payment_day);
                    if (today > nextChargeDate) {
                        nextChargeDate = addDays(nextChargeDate, 30); // simplistic month add
                    }
                    form.setValue('firstChargeDate', nextChargeDate, { shouldValidate: true });
                }
            }
        }
    }, [selectedProposalId, proposals, form]);

    return (
        <>
            <FormProvider {...form}>
                 <SheetHeader className="text-left border-b px-6 pt-4 pb-2">
                    <SheetTitle>Configure as regras da cobrança</SheetTitle>
                    <SheetDescription>Defina o plano, valores e datas para a automação.</SheetDescription>
                </SheetHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[calc(100%-145px)]">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Plano de Serviço */}
                        <FormField control={form.control} name="proposalId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Plano de Serviço</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Use como base o plano..." /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {proposals.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>

                        {/* Valores */}
                         <FormField control={form.control} name="value" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor desta cobrança</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                        <Input type="number" placeholder="1500.00" {...field} className="pl-9" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>

                        {/* Cronograma */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="paymentDay" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cobre este cliente todo dia</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => <SelectItem key={day} value={String(day)}>{day}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="firstChargeDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>A primeira cobrança será em</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant={"outline"} className={cn("w-full text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "dd 'de' MMMM 'de' yyyy") : <span>Selecione a data</span>}
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
                        </div>
                        
                        {/* Controle da Primeira Fatura */}
                         <FormField control={form.control} name="firstChargeAction" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <FormLabel className="font-normal pr-4" >Preciso aprovar a primeira cobrança manualmente</FormLabel>
                                <FormControl>
                                    <Switch
                                        checked={field.value === 'manual'}
                                        onCheckedChange={(checked) => field.onChange(checked ? 'manual' : 'auto')}
                                    />
                                </FormControl>
                            </FormItem>
                        )}/>
                    </div>

                     <SheetFooter className="border-t p-6 flex justify-between">
                         <Button type="button" variant="outline" onClick={onBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Identificação
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                           {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Revisar e Ativar'}
                           <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </SheetFooter>
                </form>
            </FormProvider>
        </>
    )
}
