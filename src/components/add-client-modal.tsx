
"use client"

import * as React from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Stepper, Step, StepLabel } from '@/components/stepper'
import { createFullClient } from "@/lib/actions/clients"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Building, MapPin, Search, DollarSign } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { Proposta, Cliente } from '@/lib/types'

const STEPS = [
  { id: 'info', label: 'Informações', icon: User },
  { id: 'address', label: 'Endereço', icon: MapPin },
  { id: 'financial', label: 'Financeiro', icon: DollarSign },
]

const clientSchema = z.object({
  personType: z.enum(['cpf', 'cnpj']),
  sex: z.enum(['male', 'female'], { required_error: 'Selecione o sexo.'}),
  
  // PF
  fullName: z.string().optional(),
  cpf: z.string().optional(),
  nationality: z.string().optional(),
  civilStatus: z.string().optional(),
  profession: z.string().optional(),
  
  // PJ
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  representativeName: z.string().optional(),
  representativeCpf: z.string().optional(),

  // Contato
  email: z.string().email({ message: "E-mail inválido."}),
  phone: z.string().optional(),

  // Endereço
  cep: z.string().min(8, { message: "O CEP deve ter 8 dígitos."}),
  street: z.string().min(1, { message: "A rua é obrigatória."}),
  number: z.string().min(1, { message: "O número é obrigatório."}),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, { message: "O bairro é obrigatório."}),
  city: z.string().min(1, { message: "A cidade é obrigatória."}),
  state: z.string().min(2, { message: "O estado é obrigatório."}),
  
  // Financeiro
  proposal_id: z.string().nullable(),
  value: z.coerce.number().optional(),
  payment_day: z.coerce.number().optional(),
  first_charge_date: z.string().optional(),
  billing_status: z.enum(['active', 'inactive']),
})
.refine(data => data.personType === 'cnpj' ? (!!data.companyName && !!data.cnpj) : (!!data.fullName && !!data.cpf), {
    message: "Preencha os campos específicos para o tipo de pessoa.",
    path: ["fullName", "companyName"], 
});


type ClientFormData = z.infer<typeof clientSchema>;

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: Cliente) => void;
  proposals: Proposta[];
}

export function AddClientModal({ isOpen, onClose, onSuccess, proposals }: AddClientModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  const { toast } = useToast()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { 
      personType: 'cpf',
      billing_status: 'inactive'
    },
    mode: 'onBlur'
  });
  
  const personType = form.watch('personType');

  React.useEffect(() => {
    if (isOpen) {
        form.reset({ personType: 'cpf', billing_status: 'inactive' });
        setActiveStep(0);
    }
  }, [isOpen, form]);

  const handleNext = async () => {
    let fieldsToValidate: (keyof ClientFormData)[] = [];
    if (activeStep === 0) {
        fieldsToValidate = personType === 'cpf' 
            ? ['personType', 'sex', 'fullName', 'cpf', 'email'] 
            : ['personType', 'sex', 'companyName', 'cnpj', 'representativeName', 'representativeCpf', 'email'];
    } else if (activeStep === 1) {
        fieldsToValidate = ['cep', 'street', 'number', 'neighborhood', 'city', 'state'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if(isValid) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleFormSubmit = async (values: ClientFormData) => {
    setIsLoading(true);
    const { data, error } = await createFullClient(values);
    setIsLoading(false);

    if (error) {
        toast({ variant: 'destructive', title: 'Erro ao Criar Cliente', description: error.message });
    } else if (data) {
        toast({ title: 'Cliente Adicionado!', description: 'O novo cliente foi salvo com sucesso.'})
        onSuccess(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>Siga as etapas para cadastrar todas as informações do cliente.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4">
          <Stepper activeStep={activeStep}>
            {STEPS.map((step) => (
              <Step key={step.id}>
                <StepLabel icon={step.icon}>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </div>
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)}>
                <div className="p-6 space-y-6">
                    {activeStep === 0 && <InfoStep form={form} />}
                    {activeStep === 1 && <AddressStep form={form} />}
                    {activeStep === 2 && <FinancialStep form={form} proposals={proposals} />}
                </div>

                 <DialogFooter className="p-6 border-t">
                    {activeStep > 0 && <Button type="button" variant="ghost" onClick={handleBack}>Voltar</Button>}
                    <div className="flex-1" />
                    {activeStep < STEPS.length - 1 ? (
                        <Button type="button" onClick={handleNext}>Avançar</Button>
                    ) : (
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Cliente'}
                        </Button>
                    )}
                </DialogFooter>
            </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}


function InfoStep({ form }: { form: any }) {
    const personType = form.watch('personType');
    const [isFetchingCnpj, setIsFetchingCnpj] = React.useState(false);
    const { toast } = useToast();

    const handleCnpjSearch = async () => {
        const cnpj = form.getValues('cnpj')?.replace(/\D/g, '');
        if (!cnpj || cnpj.length !== 14) {
        toast({ variant: 'destructive', title: 'CNPJ Inválido', description: 'Por favor, digite um CNPJ válido.' });
        return;
        }
        setIsFetchingCnpj(true);
        try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        if (!response.ok) throw new Error('Não foi possível buscar os dados do CNPJ.');
        const data = await response.json();
        form.setValue('companyName', data.razao_social, { shouldValidate: true });
        form.setValue('email', data.email || '', { shouldValidate: true });
        if (data.cep) form.setValue('cep', data.cep.replace(/\D/g, ''), { shouldValidate: true });
        if(data.logradouro) form.setValue('street', data.logradouro, { shouldValidate: true });
        if(data.numero) form.setValue('number', data.numero, { shouldValidate: true });
        if(data.bairro) form.setValue('neighborhood', data.bairro, { shouldValidate: true });
        if(data.municipio) form.setValue('city', data.municipio, { shouldValidate: true });
        if(data.uf) form.setValue('state', data.uf, { shouldValidate: true });
        toast({ title: 'Sucesso!', description: 'Dados do cliente preenchidos.' });
        } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao buscar CNPJ', description: error.message });
        } finally {
        setIsFetchingCnpj(false);
        }
    };


    return (
        <div className="space-y-4">
             <FormField control={form.control} name="personType" render={({ field }) => (
                <FormItem><FormLabel>Tipo de Pessoa</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4 pt-2">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="cpf" /></FormControl><FormLabel className="font-normal">Pessoa Física</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="cnpj" /></FormControl><FormLabel className="font-normal">Pessoa Jurídica</FormLabel></FormItem>
                </RadioGroup><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="sex" render={({ field }) => (
                <FormItem><FormLabel>Sexo</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4 pt-2">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="female" /></FormControl><FormLabel className="font-normal">Feminino</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="male" /></FormControl><FormLabel className="font-normal">Masculino</FormLabel></FormItem>
                </RadioGroup><FormMessage /></FormItem>
            )} />

             <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="contato@cliente.com" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>

             <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>

            {personType === 'cpf' ? (
                <div className="space-y-4 pt-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome do cliente" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="cpf" render={({ field }) => (
                        <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="nationality" render={({ field }) => (
                        <FormItem><FormLabel>Nacionalidade</FormLabel><FormControl><Input placeholder="Brasileiro(a)" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="civilStatus" render={({ field }) => (
                        <FormItem><FormLabel>Estado Civil</FormLabel><FormControl><Input placeholder="Solteiro(a)" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="profession" render={({ field }) => (
                        <FormItem><FormLabel>Profissão</FormLabel><FormControl><Input placeholder="Médico" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            ) : (
                <div className="space-y-4 pt-4">
                    <FormField control={form.control} name="cnpj" render={({ field }) => (
                        <FormItem><FormLabel>CNPJ</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormControl><Input placeholder="00.000.000/0001-00" {...field} /></FormControl>
                                <Button type="button" size="icon" onClick={handleCnpjSearch} disabled={isFetchingCnpj}>{isFetchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                            </div>
                        <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="companyName" render={({ field }) => (
                        <FormItem><FormLabel>Nome da Empresa (Razão Social)</FormLabel><FormControl><Input placeholder="Empresa Exemplo LTDA" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="representativeName" render={({ field }) => (
                        <FormItem><FormLabel>Nome do Representante</FormLabel><FormControl><Input placeholder="Nome do sócio administrador" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="representativeCpf" render={({ field }) => (
                        <FormItem><FormLabel>CPF do Representante</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            )}
        </div>
    )
}

function AddressStep({ form }: { form: any }) {
    const [isFetchingCep, setIsFetchingCep] = React.useState(false);
    const { toast } = useToast();

    const handleCepSearch = async () => {
        const cep = form.getValues('cep')?.replace(/\D/g, '');
        if (!cep || cep.length !== 8) {
        toast({ variant: 'destructive', title: 'CEP Inválido', description: 'Por favor, digite um CEP válido com 8 dígitos.' });
        return;
        }
        setIsFetchingCep(true);
        try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) throw new Error('Não foi possível buscar o CEP.');
        const data = await response.json();
        if (data.erro) throw new Error('CEP não encontrado.');
        form.setValue('street', data.logradouro, { shouldValidate: true });
        form.setValue('neighborhood', data.bairro, { shouldValidate: true });
        form.setValue('city', data.localidade, { shouldValidate: true });
        form.setValue('state', data.uf, { shouldValidate: true });
        toast({ title: 'Sucesso!', description: 'Endereço preenchido.' });
        } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao buscar CEP', description: error.message });
        } finally {
        setIsFetchingCep(false);
        }
    };

    return (
        <div className="space-y-4">
             <FormField control={form.control} name="cep" render={({ field }) => (
                <FormItem><FormLabel>CEP</FormLabel>
                    <div className="flex items-center gap-2">
                        <FormControl><Input placeholder="00000-000" {...field} /></FormControl>
                        <Button type="button" size="icon" onClick={handleCepSearch} disabled={isFetchingCep}>{isFetchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                    </div>
                <FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="street" render={({ field }) => (
                <FormItem><FormLabel>Rua</FormLabel><FormControl><Input placeholder="Rua das Flores" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="number" render={({ field }) => (
                    <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="complement" render={({ field }) => (
                    <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto 42" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="neighborhood" render={({ field }) => (
                <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="SP" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
        </div>
    )
}

function FinancialStep({ form, proposals }: { form: any, proposals: Proposta[] }) {
    const selectedProposalId = form.watch('proposal_id');

    React.useEffect(() => {
        if (selectedProposalId) {
            const proposal = proposals.find(p => p.id === selectedProposalId);
            if (proposal) {
                if (proposal.value) form.setValue('value', proposal.value);
                if (proposal.payment_day) form.setValue('payment_day', proposal.payment_day);
            }
        }
    }, [selectedProposalId, proposals, form]);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="proposal_id"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Vincular Proposta (Opcional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === 'null-value' ? null : value)} value={field.value ?? 'null-value'}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione para preencher valores" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="null-value">Nenhuma</SelectItem>
                        {proposals.map(proposal => (
                            <SelectItem key={proposal.id} value={proposal.id}>{proposal.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField control={form.control} name="value" render={({ field }) => (
                <FormItem><FormLabel>Valor da Cobrança (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="1500.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="payment_day" render={({ field }) => (
                    <FormItem><FormLabel>Dia do Vencimento</FormLabel><FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="first_charge_date" render={({ field }) => (
                    <FormItem><FormLabel>Data da 1ª Cobrança</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormDescription className="text-xs">Se branco, usa a data de hoje.</FormDescription><FormMessage /></FormItem>
                )}/>
            </div>
            <FormField control={form.control} name="billing_status" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                    <FormLabel>Ativar Recorrência</FormLabel>
                    <FormDescription className="text-xs">Se ativo, a primeira cobrança será gerada agora e as futuras serão automáticas.</FormDescription>
                </div>
                <FormControl><Switch checked={field.value === 'active'} onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')} /></FormControl>
                </FormItem>
            )}/>
        </div>
    )
}

    