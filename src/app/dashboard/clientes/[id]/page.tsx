

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, User, Building, Search, CheckCircle, Edit, ArrowLeft, DollarSign, FileText, BarChart, Info, Calendar, BadgeCheck, XCircle, MoreVertical } from 'lucide-react'
import { getClientById, updateClientProfile, updateClientFinancials } from '@/lib/actions/clients'
import { getProposals } from '@/lib/actions/propostas'
import { getChargesByClientId, markChargeAsPaid } from '@/lib/actions/cobrancas'
import { useToast } from '@/hooks/use-toast'
import type { Cliente, Proposta, Cobranca } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link'
import { format, isPast } from 'date-fns'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'


const clientInfoSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  representativeName: z.string().optional(),
  representativeCpf: z.string().optional(),
  fullName: z.string().optional(),
  nationality: z.string().optional(),
  civilStatus: z.string().optional(),
  profession: z.string().optional(),
  cpf: z.string().optional(),
});


const addressSchema = z.object({
  cep: z.string().min(8, { message: "O CEP é obrigatório e deve ter 8 dígitos."}),
  street: z.string().min(1, { message: "A rua é obrigatória."}),
  number: z.string().min(1, { message: "O número é obrigatório."}),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, { message: "O bairro é obrigatório."}),
  city: z.string().min(1, { message: "A cidade é obrigatória."}),
  state: z.string().min(2, { message: "O estado é obrigatório."}),
});

const financialSchema = z.object({
  billing_status: z.enum(['active', 'inactive']),
  proposal_id: z.string().nullable(),
  value: z.string().nullable(),
  payment_day: z.string().nullable(),
  first_charge_date: z.string().nullable(),
});


const combinedSchema = z.object({
  personType: z.enum(['cpf', 'cnpj']),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  representativeName: z.string().optional(),
  representativeCpf: z.string().optional(),
  fullName: z.string().optional(),
  nationality: z.string().optional(),
  civilStatus: z.string().optional(),
  profession: z.string().optional(),
  cpf: z.string().optional(),
  cep: z.string().min(8, { message: "O CEP é obrigatório e deve ter 8 dígitos."}),
  street: z.string().min(1, { message: "A rua é obrigatória."}),
  number: z.string().min(1, { message: "O número é obrigatório."}),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, { message: "O bairro é obrigatório."}),
  city: z.string().min(1, { message: "A cidade é obrigatória."}),
  state: z.string().min(2, { message: "O estado é obrigatório."}),
  billing_status: z.enum(['active', 'inactive']),
  proposal_id: z.string().nullable(),
  value: z.string().nullable(),
  payment_day: z.string().nullable(),
  first_charge_date: z.string().nullable(),
}).refine(data => {
    if (data.personType === 'cnpj') {
        return !!data.companyName && !!data.cnpj && !!data.representativeName && !!data.representativeCpf;
    }
    return true;
}, {
    message: "Para Pessoa Jurídica, preencha: Nome da Empresa, CNPJ, Nome e CPF do representante.",
    path: ["companyName"],
}).refine(data => {
    if (data.personType === 'cpf') {
        return !!data.fullName && !!data.nationality && !!data.civilStatus && !!data.profession && !!data.cpf;
    }
    return true;
}, {
    message: "Para Pessoa Física, preencha: Nome, Nacionalidade, Estado Civil, Profissão e CPF.",
    path: ["fullName"],
});


type ClientFormData = z.infer<typeof combinedSchema>;
type StepName = 'info' | 'address' | 'financial';

export default function ClienteEditPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Cliente | null>(null);
  const [proposals, setProposals] = useState<Proposta[]>([]);
  const [charges, setCharges] = useState<Cobranca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StepName>('info');
  const [editingStep, setEditingStep] = useState<StepName | null>(null);
  const { toast } = useToast();

  const methods = useForm<ClientFormData>({
    resolver: zodResolver(combinedSchema),
    mode: 'onBlur',
    defaultValues: {
        personType: 'cpf',
        email: '',
        companyName: '',
        cnpj: '',
        representativeName: '',
        representativeCpf: '',
        fullName: '',
        nationality: '',
        civilStatus: '',
        profession: '',
        cpf: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        billing_status: 'inactive',
        proposal_id: null,
        value: null,
        payment_day: null,
        first_charge_date: null,
    },
  });

  const parseAddress = (addressString: string | null | undefined) => {
    if (!addressString) return {};
    const cepMatch = addressString.match(/CEP: ([\d-]+)/);
    const streetMatch = addressString.match(/^([^,]+),/);
    const numberMatch = addressString.match(/, ([^,]+)/);
    const complementMatch = addressString.match(/, (.*?) - /);
    const neighborhoodMatch = addressString.match(/- ([^,]+),/);
    const cityMatch = addressString.match(/, ([^,]+) -/);
    const stateMatch = addressString.match(/- (\w{2}),/);
    
    return {
      cep: cepMatch ? cepMatch[1].replace(/\D/g, '') : '',
      street: streetMatch ? streetMatch[1].trim() : '',
      number: numberMatch ? numberMatch[1].trim().split(' ')[0] : '',
      complement: complementMatch ? complementMatch[1].trim() : '',
      neighborhood: neighborhoodMatch ? neighborhoodMatch[1].trim() : '',
      city: cityMatch ? cityMatch[1].trim() : '',
      state: stateMatch ? stateMatch[1].trim() : '',
    };
  };

  const fetchClientData = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);

    const [{ data, error }, { data: proposalsData }, {data: chargesData}] = await Promise.all([
        getClientById(clientId),
        getProposals(),
        getChargesByClientId(clientId),
    ]);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Carregar Cliente', description: error.message });
      setIsLoading(false);
      return;
    } 
    
    if (data) {
      setClient(data);
      setProposals(proposalsData || []);
      setCharges(chargesData || []);
      const addressParts = parseAddress(data.address);
      
      const defaultValues: Partial<ClientFormData> = {
        personType: data.person_type as 'cpf' | 'cnpj' || 'cpf',
        email: data.email || '',
        companyName: data.company_name || '',
        cnpj: data.cnpj || '',
        representativeName: data.representative_name || '',
        representativeCpf: data.representative_cpf || '',
        fullName: data.full_name || '',
        nationality: data.nationality || '',
        civilStatus: data.civil_status || '',
        profession: data.profession || '',
        cpf: data.cpf || '',
        billing_status: data.billing_status || 'inactive',
        proposal_id: data.proposal_id || null,
        value: data.value ? String(data.value) : null,
        payment_day: data.payment_day ? String(data.payment_day) : null,
        first_charge_date: data.first_charge_date ? format(new Date(data.first_charge_date), 'yyyy-MM-dd') : null,
        ...addressParts,
        cep: addressParts.cep || '',
        street: addressParts.street || '',
        number: addressParts.number || '',
        complement: addressParts.complement || '',
        neighborhood: addressParts.neighborhood || '',
        city: addressParts.city || '',
        state: addressParts.state || '',
      };
      
      methods.reset(defaultValues as ClientFormData);
      setEditingStep(null);
    }
    setIsLoading(false);
  }, [clientId, toast, methods.reset]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const handleSaveStep = async (step: StepName) => {
    let schema;
    let fieldNames: (keyof ClientFormData)[];
    switch(step) {
      case 'info': 
        schema = clientInfoSchema; 
        fieldNames = Object.keys(schema.shape) as (keyof typeof schema.shape)[];
        break;
      case 'address': 
        schema = addressSchema; 
        fieldNames = Object.keys(schema.shape) as (keyof typeof schema.shape)[];
        break;
      case 'financial':
        schema = financialSchema;
        fieldNames = Object.keys(schema.shape) as (keyof typeof schema.shape)[];
        break;
    }

    const isValid = await methods.trigger(fieldNames);

    if (!isValid) {
      toast({ variant: 'destructive', title: 'Campos Inválidos', description: 'Por favor, corrija os erros antes de salvar.' });
      return;
    }
    
    setIsLoading(true);
    const values = methods.getValues();
    
    let error;

    if (step === 'info' || step === 'address') {
        const address = values.cep ? `${values.street}, ${values.number}${values.complement ? `, ${values.complement}` : ''} - ${values.neighborhood}, ${values.city} - ${values.state}, CEP: ${values.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}` : '';
        const submissionData = { ...values, address };
        const result = await updateClientProfile(clientId, submissionData);
        error = result.error;
    } else if (step === 'financial') {
        const result = await updateClientFinancials(clientId, { 
            billing_status: values.billing_status, 
            proposal_id: values.proposal_id, 
            value: values.value,
            payment_day: values.payment_day,
            first_charge_date: values.first_charge_date,
        });
        error = result.error;
    }

    setIsLoading(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: error.message });
    } else {
      toast({ variant: 'default', title: 'Salvo!', description: 'As informações foram atualizadas.', className: 'bg-green-100 border-green-200 text-green-800' });
      setEditingStep(null);
      await fetchClientData();
      
      if (step === 'info') setActiveTab('address');
      if (step === 'address') setActiveTab('financial');
    }
  };

  const handleMarkAsPaid = async (chargeId: string) => {
    setIsLoading(true);
    const { error } = await markChargeAsPaid(chargeId);
     if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'Cobrança marcada como paga.' });
      await fetchClientData();
    }
    setIsLoading(false);
  }
  
  const isInfoComplete = clientInfoSchema.safeParse(methods.getValues()).success;
  const isAddressComplete = addressSchema.safeParse(methods.getValues()).success;
  const isFinancialComplete = financialSchema.safeParse(methods.getValues()).success;

  if (isLoading && !client) {
    return <div className="flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!client) {
     return <div className="flex items-center justify-center p-6">Cliente não encontrado.</div>;
  }
  
  return (
    <FormProvider {...methods}>
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-10">
        <div className="flex items-center gap-4">
             <Button asChild variant="outline" size="icon" className="h-7 w-7">
              <Link href="/dashboard/clientes">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <Avatar className="h-24 w-24">
            <AvatarImage src={client.avatar_url || ''} alt="Avatar do Cliente" />
            <AvatarFallback>{(client.full_name || client.company_name || 'C').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <h2 className="text-2xl font-bold">{client.full_name || client.company_name}</h2>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-700">Ativo</Badge>
                    <Badge variant="secondary">{client.person_type === 'cpf' ? 'Pessoa Física' : 'Pessoa Jurídica'}</Badge>
                </div>
            </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StepName)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100">
             <TabsTrigger value="info" disabled={editingStep !== null && editingStep !== 'info'}>
                {isInfoComplete && editingStep !== 'info' && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                Informações
             </TabsTrigger>
             <TabsTrigger value="address" disabled={!isInfoComplete || (editingStep !== null && editingStep !== 'address')}>
                 {isAddressComplete && editingStep !== 'address' && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                 Endereço
             </TabsTrigger>
             <TabsTrigger value="financial" disabled={!isInfoComplete || !isAddressComplete || (editingStep !== null && editingStep !== 'financial')}>
                 {isFinancialComplete && editingStep !== 'financial' && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                 Financeiro
             </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info">
            <InfoStep isEditing={editingStep === 'info'} setEditingStep={setEditingStep} onSave={() => handleSaveStep('info')} isLoading={isLoading} />
          </TabsContent>
           <TabsContent value="address">
            <AddressStep isEditing={editingStep === 'address'} setEditingStep={setEditingStep} onSave={() => handleSaveStep('address')} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="financial">
            <FinancialStep 
                isEditing={editingStep === 'financial'} 
                setEditingStep={setEditingStep} 
                onSave={() => handleSaveStep('financial')} 
                isLoading={isLoading} 
                proposals={proposals} 
                charges={charges}
                onMarkAsPaid={handleMarkAsPaid}
            />
          </TabsContent>
        </Tabs>
      </div>
    </FormProvider>
  );
}


interface StepProps {
  isEditing: boolean;
  setEditingStep: (step: StepName | null) => void;
  onSave: () => Promise<void>;
  isLoading: boolean;
}

function InfoStep({ isEditing, setEditingStep, onSave, isLoading }: StepProps) {
  const methods = useFormContext<ClientFormData>();
  const { toast } = useToast();
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const personType = methods.watch('personType');

    const handleCnpjSearch = async () => {
    const cnpj = methods.getValues('cnpj')?.replace(/\D/g, '');
    if (!cnpj || cnpj.length !== 14) {
      toast({ variant: 'destructive', title: 'CNPJ Inválido', description: 'Por favor, digite um CNPJ válido.' });
      return;
    }
    setIsFetchingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) throw new Error('Não foi possível buscar os dados do CNPJ.');
      const data = await response.json();
      methods.setValue('companyName', data.razao_social, { shouldValidate: true });
      methods.setValue('email', data.email, { shouldValidate: true });
      if (data.cep) {
        methods.setValue('cep', data.cep.replace(/\D/g, ''), { shouldValidate: true });
      }
      if(data.logradouro) methods.setValue('street', data.logradouro, { shouldValidate: true });
      if(data.numero) methods.setValue('number', data.numero, { shouldValidate: true });
      if(data.bairro) methods.setValue('neighborhood', data.bairro, { shouldValidate: true });
      if(data.municipio) methods.setValue('city', data.municipio, { shouldValidate: true });
      if(data.uf) methods.setValue('state', data.uf, { shouldValidate: true });
      toast({ title: 'Sucesso!', description: 'Dados do CNPJ preenchidos.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar CNPJ', description: error.message });
    } finally {
      setIsFetchingCnpj(false);
    }
  };


  if (isEditing) {
    return (
        <Card>
            <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
            <CardDescription>Preencha os detalhes de acordo com o tipo de pessoa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <FormField control={methods.control} name="email" render={({ field }) => (
                <FormItem>
                <FormLabel>E-mail do Cliente</FormLabel>
                <FormControl><Input type="email" placeholder="email@cliente.com" {...field} /></FormControl>
                <FormDescription>Este e-mail será usado para enviar o código de assinatura do contrato.</FormDescription>
                <FormMessage />
                </FormItem>
            )} />
            
            {personType === 'cnpj' && (
                <div className="space-y-4 pt-4">
                    <FormField control={methods.control} name="companyName" render={({ field }) => (
                        <FormItem><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Empresa Contratante LTDA" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                        <FormField control={methods.control} name="cnpj" render={({ field }) => (
                        <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormControl><Input placeholder="00.000.000/0001-00" {...field} /></FormControl>
                                <Button type="button" size="icon" onClick={handleCnpjSearch} disabled={isFetchingCnpj}>{isFetchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={methods.control} name="representativeName" render={({ field }) => (
                        <FormItem><FormLabel>Nome do Representante Legal</FormLabel><FormControl><Input placeholder="Nome do representante" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={methods.control} name="representativeCpf" render={({ field }) => (
                        <FormItem><FormLabel>CPF do Representante</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            )}

            {personType === 'cpf' && (
                    <div className="space-y-4 pt-4">
                        <FormField control={methods.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome completo do cliente" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={methods.control} name="nationality" render={({ field }) => (
                            <FormItem><FormLabel>Nacionalidade</FormLabel><FormControl><Input placeholder="Brasileira" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={methods.control} name="civilStatus" render={({ field }) => (
                            <FormItem><FormLabel>Estado Civil</FormLabel><FormControl><Input placeholder="Solteiro(a)" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                    <FormField control={methods.control} name="profession" render={({ field }) => (
                        <FormItem><FormLabel>Profissão</FormLabel><FormControl><Input placeholder="Profissão do cliente" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={methods.control} name="cpf" render={({ field }) => (
                        <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    </div>
            )}

            </CardContent>
            <CardContent className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingStep(null)}>Cancelar</Button>
            <Button type="button" onClick={onSave} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar e Continuar'}</Button>
        </CardContent>
        </Card>
    );
  }

  const clientData = methods.getValues();

  return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardTitle>Informações do Cliente</CardTitle>
                <CardDescription>
                    {personType === 'cpf' ? `CPF: ${clientData.cpf || 'Não preenchido'}` : `CNPJ: ${clientData.cnpj || 'Não preenchido'}`}
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditingStep('info')}><Edit className="mr-2 h-4 w-4" />Editar</Button>
        </CardHeader>
        <CardContent className="space-y-4 text-sm pt-6">
            <p><strong>E-mail:</strong> {clientData.email || 'Não preenchido'}</p>
            {personType === 'cpf' && (
                <>
                    <p><strong>Nome Completo:</strong> {clientData.fullName || 'Não preenchido'}</p>
                    <p><strong>Nacionalidade:</strong> {clientData.nationality || 'Não preenchido'}</p>
                    <p><strong>Estado Civil:</strong> {clientData.civilStatus || 'Não preenchido'}</p>
                    <p><strong>Profissão:</strong> {clientData.profession || 'Não preenchido'}</p>
                    <p><strong>CPF:</strong> {clientData.cpf || 'Não preenchido'}</p>
                </>
            )}
             {personType === 'cnpj' && (
                <>
                    <p><strong>Nome da Empresa:</strong> {clientData.companyName || 'Não preenchido'}</p>
                    <p><strong>CNPJ:</strong> {clientData.cnpj || 'Não preenchido'}</p>
                    <p><strong>Representante Legal:</strong> {clientData.representativeName || 'Não preenchido'}</p>
                    <p><strong>CPF do Representante:</strong> {clientData.representativeCpf || 'Não preenchido'}</p>
                </>
            )}
        </CardContent>
    </Card>
  )
}

function AddressStep({ isEditing, setEditingStep, onSave, isLoading }: StepProps) {
  const methods = useFormContext<ClientFormData>();
  const { toast } = useToast();
  const [isFetchingCep, setIsFetchingCep] = useState(false);

    const handleCepSearch = async () => {
        const cep = methods.getValues('cep')?.replace(/\D/g, '');
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
        methods.setValue('street', data.logradouro, { shouldValidate: true });
        methods.setValue('neighborhood', data.bairro, { shouldValidate: true });
        methods.setValue('city', data.localidade, { shouldValidate: true });
        methods.setValue('state', data.uf, { shouldValidate: true });
        toast({ title: 'Sucesso!', description: 'Endereço preenchido.' });
        } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao buscar CEP', description: error.message });
        } finally {
        setIsFetchingCep(false);
        }
    };

    if (isEditing) {
        return (
            <Card>
            <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Informe o endereço completo do cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={methods.control} name="cep" render={({ field }) => (
                    <FormItem className="md:col-span-1">
                        <FormLabel>CEP</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl><Input placeholder="00000-000" {...field} /></FormControl>
                            <Button type="button" size="icon" onClick={handleCepSearch} disabled={isFetchingCep}>{isFetchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}/>
                    <FormField control={methods.control} name="street" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Rua / Logradouro</FormLabel>
                        <FormControl><Input placeholder="Ex: Rua das Flores" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={methods.control} name="number" render={({ field }) => (
                    <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={methods.control} name="complement" render={({ field }) => (
                    <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto 45" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={methods.control} name="neighborhood" render={({ field }) => (
                    <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={methods.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={methods.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="SP" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </CardContent>
                <CardContent className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditingStep(null)}>Cancelar</Button>
                <Button type="button" onClick={onSave} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar e Continuar'}</Button>
            </CardContent>
            </Card>
        )
    }
    
    const clientData = methods.getValues();
    const fullAddress = clientData.street ? 
        `${clientData.street}, ${clientData.number}${clientData.complement ? `, ${clientData.complement}` : ''} - ${clientData.neighborhood}, ${clientData.city}/${clientData.state} - CEP: ${clientData.cep}`
        : 'Não preenchido';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle>Endereço</CardTitle>
                    <CardDescription>{clientData.street ? `${clientData.street}, ${clientData.number}` : 'Não preenchido'}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditingStep('address')}><Edit className="mr-2 h-4 w-4" />Editar</Button>
            </CardHeader>
            <CardContent className="pt-6 text-sm">
                 <p>{fullAddress}</p>
            </CardContent>
        </Card>
    )
}

interface FinancialStepProps extends StepProps {
    proposals: Proposta[];
    charges: Cobranca[];
    onMarkAsPaid: (chargeId: string) => Promise<void>;
}

const getStatusInfo = (status: string, dueDate: string) => {
    if (status === 'pago') {
      return { text: 'Pago', className: 'border-green-500 bg-green-500/10 text-green-700' };
    }
    if (isPast(new Date(dueDate))) {
      return { text: 'Atrasado', className: 'border-red-500 bg-red-500/10 text-red-700' };
    }
    return { text: 'Pendente', className: 'border-yellow-500 bg-yellow-500/10 text-yellow-700' };
}

function FinancialStep({ isEditing, setEditingStep, onSave, isLoading, proposals, charges, onMarkAsPaid }: FinancialStepProps) {
  const methods = useFormContext<ClientFormData>();
  const clientData = methods.getValues();
  const selectedProposalId = methods.watch('proposal_id');
  const selectedProposal = proposals.find(p => p.id === selectedProposalId);

   React.useEffect(() => {
    const proposal = proposals.find(p => p.id === selectedProposalId);
    if (proposal) {
        methods.setValue('value', proposal.value ? String(proposal.value) : '', { shouldValidate: true });
        if(proposal.payment_day) methods.setValue('payment_day', String(proposal.payment_day), { shouldValidate: true });
    }
   }, [selectedProposalId, proposals, methods]);

    if (isEditing) {
        return (
            <div className="grid lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configuração da Cobrança</CardTitle>
                    <CardDescription>Defina a proposta, valor e o status da automação de cobrança.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={methods.control}
                        name="proposal_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proposta de Serviço</FormLabel>
                                <Select 
                                    onValueChange={(value) => field.onChange(value === 'null-value' ? null : value)} 
                                    value={field.value ?? 'null-value'}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma proposta para vincular" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="null-value">Nenhuma</SelectItem>
                                        {proposals.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>Esta proposta servirá como base para valor e termos.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={methods.control}
                        name="value"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor da Mensalidade (R$)</FormLabel>
                                <FormControl><Input type="number" placeholder="1500.00" {...field} value={field.value || ''} /></FormControl>
                                <FormDescription>Se uma proposta for selecionada, este valor será preenchido automaticamente, mas pode ser editado.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={methods.control}
                            name="payment_day"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dia do Vencimento</FormLabel>
                                    <FormControl><Input type="number" placeholder="10" {...field} value={field.value || ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={methods.control}
                            name="first_charge_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Início das Cobranças</FormLabel>
                                    <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={methods.control}
                        name="billing_status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Automação de Cobrança</FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="active">Ativa</SelectItem>
                                        <SelectItem value="inactive">Inativa</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>Cobranças futuras só serão geradas para clientes com status "Ativo".</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardContent className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEditingStep(null)}>Cancelar</Button>
                    <Button type="button" onClick={onSave} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Configuração'}</Button>
                </CardContent>
            </Card>
             <ChargeHistory charges={charges} onMarkAsPaid={onMarkAsPaid} />
            </div>
        )
    }

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle>Configuração Financeira</CardTitle>
                        <CardDescription>
                            Automação de cobrança: {clientData.billing_status === 'active' ? 'Ativa' : 'Inativa'}
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingStep('financial')}><Edit className="mr-2 h-4 w-4" />Editar</Button>
                </CardHeader>
                <CardContent className="space-y-4 text-sm pt-6">
                     <p className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Valor Mensal:</strong>&nbsp;R$ {Number(clientData.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Vencimento:</strong>&nbsp;Todo dia {clientData.payment_day || 'N/A'}
                    </p>
                     {clientData.first_charge_date && (
                        <p className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <strong>Início das cobranças:</strong>&nbsp;{format(new Date(clientData.first_charge_date), 'dd/MM/yyyy')}
                        </p>
                     )}
                    {selectedProposal ? (
                        <div className="space-y-2 rounded-md border p-4 bg-muted/50">
                            <h4 className="font-semibold text-base">{selectedProposal.name}</h4>
                            <div className="flex items-center text-muted-foreground">
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Proposta de serviço vinculada</span>
                            </div>
                        </div>
                    ) : (
                        <p>Nenhuma proposta de serviço vinculada a este cliente.</p>
                    )}
                </CardContent>
            </Card>
             <ChargeHistory charges={charges} onMarkAsPaid={onMarkAsPaid} />
        </div>
    )
}

function ChargeHistory({ charges, onMarkAsPaid }: { charges: Cobranca[], onMarkAsPaid: (id: string) => Promise<void> }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Cobranças</CardTitle>
                <CardDescription>Lista de cobranças geradas para este cliente.</CardDescription>
            </CardHeader>
            <CardContent>
                {charges.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                        <Calendar className="mx-auto h-8 w-8 mb-2" />
                        <p>Nenhuma cobrança gerada ainda.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {charges.map(charge => {
                                const status = getStatusInfo(charge.status, charge.due_date);
                                return (
                                <TableRow key={charge.id}>
                                    <TableCell>{format(new Date(charge.due_date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>R$ {Number(charge.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("font-normal", status.className)}>{status.text}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {charge.status === 'pendente' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onMarkAsPaid(charge.id)}>
                                                        <BadgeCheck className="mr-2 h-4 w-4" />
                                                        Marcar como Pago
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
    

    

    

    



    
