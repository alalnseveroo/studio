
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
import { Loader2, User, Building, MapPin, Search, DollarSign, ListChecks } from 'lucide-react'
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
import { Switch } from './ui/switch'

const STEPS = [
  { id: 'info', label: 'Informações Básicas', icon: User },
  { id: 'details', label: 'Detalhes Completos', icon: ListChecks },
]

const clientSchema = z.object({
  personType: z.enum(['cpf', 'cnpj']),
  sex: z.enum(['male', 'female'], { required_error: 'Selecione o sexo.'}),
  email: z.string().email({ message: "E-mail inválido."}),

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
  phone: z.string().optional(),

  // Endereço
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  
  // Financeiro
  proposal_id: z.string().nullable(),
  value: z.coerce.number().optional(),
  payment_day: z.coerce.number().optional(),
  first_charge_date: z.string().optional(),
  billing_status: z.enum(['active', 'inactive']),
})
.refine(data => data.personType === 'cnpj' ? !!data.companyName : !!data.fullName, {
    message: "O nome é obrigatório.",
    path: ["fullName"], 
})
.refine(data => { // Validação condicional para a segunda etapa
    if (data.personType === 'cpf') {
        return !!data.cpf && !!data.nationality && !!data.civilStatus && !!data.profession && !!data.cep;
    }
    if (data.personType === 'cnpj') {
        return !!data.cnpj && !!data.representativeName && !!data.representativeCpf && !!data.cep;
    }
    return true;
}, {
    message: "Todos os campos de detalhe são obrigatórios para prosseguir.",
    path: ["cpf", "cnpj", "cep"] // Apenas um caminho para a mensagem de erro geral
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
        fieldsToValidate = ['personType', 'sex', 'email'];
        if (personType === 'cpf') fieldsToValidate.push('fullName');
        if (personType === 'cnpj') fieldsToValidate.push('companyName');
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
          <DialogTitle className="text-xl font-normal">Adicionar Novo Cliente</DialogTitle>
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
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {activeStep === 0 && <InfoStep form={form} />}
                    {activeStep === 1 && <DetailsStep form={form} proposals={proposals} />}
                </div>

                 <DialogFooter className="p-6 pt-0 border-t">
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
    
    return (
        <div className="space-y-4">
             <FormField control={form.control} name="personType" render={({ field }) => (
                <FormItem><FormLabel>Tipo de Pessoa</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4 pt-2">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="cpf" /></FormControl><FormLabel className="font-normal">Pessoa Física</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="cnpj" /></FormControl><FormLabel className="font-normal">Pessoa Jurídica</FormLabel></FormItem>
                </RadioGroup><FormMessage /></FormItem>
            )} />

             <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="contato@cliente.com" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
            )}/>
            
            {personType === 'cpf' ? (
                 <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome do cliente" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                )}/>
            ) : (
                <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem><FormLabel>Nome da Empresa (Razão Social)</FormLabel><FormControl><Input placeholder="Empresa Exemplo LTDA" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                )}/>
            )}

            <FormField control={form.control} name="sex" render={({ field }) => (
                <FormItem><FormLabel>Sexo</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4 pt-2">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="female" /></FormControl><FormLabel className="font-normal">Feminino</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="male" /></FormControl><FormLabel className="font-normal">Masculino</FormLabel></FormItem>
                </RadioGroup><FormMessage /></FormItem>
            )} />
        </div>
    )
}

function DetailsStep({ form, proposals }: { form: any, proposals: Proposta[] }) {
    const personType = form.watch('personType');
    const [isFetchingCep, setIsFetchingCep] = React.useState(false);
    const [isFetchingCnpj, setIsFetchingCnpj] = React.useState(false);
    const { toast } = useToast();
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
             <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(11) 99999-9999" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
            )}/>

            {personType === 'cpf' ? (
                <div className="space-y-4 pt-4">
                    <FormField control={form.control} name="cpf" render={({ field }) => (
                        <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="nationality" render={({ field }) => (
                        <FormItem><FormLabel>Nacionalidade</FormLabel><FormControl><Input placeholder="Brasileiro(a)" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="civilStatus" render={({ field }) => (
                        <FormItem><FormLabel>Estado Civil</FormLabel><FormControl><Input placeholder="Solteiro(a)" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="profession" render={({ field }) => (
                        <FormItem><FormLabel>Profissão</FormLabel><FormControl><Input placeholder="Médico" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            ) : (
                <div className="space-y-4 pt-4">
                    <FormField control={form.control} name="cnpj" render={({ field }) => (
                        <FormItem><FormLabel>CNPJ</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormControl><Input placeholder="00.000.000/0001-00" {...field} className="h-9"/></FormControl>
                                <Button type="button" size="icon" className="h-9 w-9" onClick={handleCnpjSearch} disabled={isFetchingCnpj}>{isFetchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                            </div>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="representativeName" render={({ field }) => (
                        <FormItem><FormLabel>Nome do Representante</FormLabel><FormControl><Input placeholder="Nome do sócio administrador" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="representativeCpf" render={({ field }) => (
                        <FormItem><FormLabel>CPF do Representante</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            )}

            <div className="space-y-4 pt-4">
                <h3 className="text-base font-semibold border-b pb-2">Endereço</h3>
                 <FormField control={form.control} name="cep" render={({ field }) => (
                    <FormItem><FormLabel>CEP</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl><Input placeholder="00000-000" {...field} className="h-9"/></FormControl>
                            <Button type="button" size="icon" className="h-9 w-9" onClick={handleCepSearch} disabled={isFetchingCep}>{isFetchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                        </div>
                    <FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="street" render={({ field }) => (
                    <FormItem><FormLabel>Rua</FormLabel><FormControl><Input placeholder="Rua das Flores" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="number" render={({ field }) => (
                        <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="complement" render={({ field }) => (
                        <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto 42" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="neighborhood" render={({ field }) => (
                    <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                )}/>
                 <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="SP" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </div>

             <div className="space-y-4 pt-4">
                <h3 className="text-base font-semibold border-b pb-2">Financeiro (Opcional)</h3>
                 <FormField
                    control={form.control}
                    name="proposal_id"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Vincular Proposta</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'null-value' ? null : value)} value={field.value ?? 'null-value'}>
                        <FormControl>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Selecione para preencher valores" /></SelectTrigger>
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
                    <FormItem><FormLabel>Valor da Cobrança (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="1500.00" {...field} value={field.value ?? ''} className="h-9"/></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="payment_day" render={({ field }) => (
                        <FormItem><FormLabel>Dia do Vencimento</FormLabel><FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''} className="h-9"/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="first_charge_date" render={({ field }) => (
                        <FormItem><FormLabel>Data da 1ª Cobrança</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} className="h-9"/></FormControl><FormDescription className="text-xs">Se branco, usa a data de hoje.</FormDescription><FormMessage /></FormItem>
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
        </div>
    )
}
