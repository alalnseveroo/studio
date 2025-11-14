'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { format, isPast, parseISO } from 'date-fns'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2, Search, CheckCircle, Edit, DollarSign, FileText, Calendar, BadgeCheck, MoreVertical, Upload, Trash2 } from 'lucide-react'
import { getClientById, updateClientProfile, updateClientFinancials, uploadExternalContract } from '@/lib/actions/clients'
import { getProposals } from '@/lib/actions/propostas'
import { getChargesByClientId, markChargeAsPaid, deleteCharge } from '@/lib/actions/cobrancas'
import { useToast } from '@/hooks/use-toast'
import type { Cliente, Proposta, Cobranca, ExternalContract } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { UploadInvoiceModal } from '@/components/upload-invoice-modal'
import { UploadContractModal } from '@/components/upload-contract-modal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'

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
        return !!data.companyName && !!data.cnpj;
    }
    return true;
}, {
    message: "Para Pessoa Jurídica, preencha: Nome da Empresa e CNPJ.",
    path: ["companyName"],
}).refine(data => {
    if (data.personType === 'cpf') {
        return !!data.fullName && !!data.cpf;
    }
    return true;
}, {
    message: "Para Pessoa Física, preencha: Nome Completo e CPF.",
    path: ["fullName"],
});


type ClientFormData = z.infer<typeof combinedSchema>;
type StepName = 'info' | 'address' | 'financial' | 'contracts';

function PageLoadingSkeleton() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-5 w-32" />
                </div>
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-3/4" />
                </CardContent>
            </Card>
        </div>
    )
}

interface ClientDetailSheetProps {
    client: Cliente | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const parseAddress = (addressString: string | null | undefined): { cep: string, street: string, number: string, complement: string, neighborhood: string, city: string, state: string } => {
    if (!addressString) {
        return { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' };
    }
    const cepMatch = addressString.match(/CEP: ([\d-]+)/);
    const streetMatch = addressString.match(/^([^,]+)/);
    const numberMatch = addressString.match(/,\s*([\d\w]+)/);
    const neighborhoodMatch = addressString.match(/-\s*([^,]+),/);
    const cityStateMatch = addressString.match(/,\s*([^,]+)\s*-\s*([A-Z]{2}),/);
    const complementMatch = addressString.match(/, (.*?)-/);

    return {
        street: streetMatch?.[1].trim() ?? '',
        number: numberMatch?.[1].trim() ?? '',
        complement: complementMatch && complementMatch[1].includes(numberMatch?.[1] ?? '§§§') ? complementMatch[1].replace(numberMatch?.[1] ?? '', '').replace(',', '').trim() : '',
        neighborhood: neighborhoodMatch?.[1].trim() ?? '',
        city: cityStateMatch?.[1].trim() ?? '',
        state: cityStateMatch?.[2].trim() ?? '',
        cep: cepMatch?.[1].replace(/\D/g, '') ?? ''
    };
};

export function ClientDetailSheet({ client: initialClient, isOpen, onClose, onUpdate }: ClientDetailSheetProps) {
  const [client, setClient] = useState<Cliente | null>(initialClient);
  const [proposals, setProposals] = useState<Proposta[]>([]);
  const [charges, setCharges] = useState<Cobranca[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<StepName>('info');
  const [editingStep, setEditingStep] = useState<StepName | null>(null);
  const [isClientSide, setIsClientSide] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  const methods = useForm<ClientFormData>({
    resolver: zodResolver(combinedSchema),
    mode: 'onBlur',
  });

  const fetchClientData = useCallback(async () => {
    if (!initialClient?.id) return;
    setIsLoading(true);

    const [{ data, error }, { data: proposalsData }, {data: chargesData}] = await Promise.all([
        getClientById(initialClient.id),
        getProposals(),
        getChargesByClientId(initialClient.id),
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
        personType: data.person_type || 'cpf',
        email: data.email || '',
        companyName: data.company_name || data.company_nar || '',
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
        first_charge_date: data.first_charge_date ? format(parseISO(data.first_charge_date), 'yyyy-MM-dd') : null,
        ...addressParts,
      };
      
      methods.reset(defaultValues as ClientFormData);
      setEditingStep(null);
    }
    setIsLoading(false);
  }, [initialClient?.id, toast, methods]);

  useEffect(() => {
    if (isOpen) {
        fetchClientData();
    }
  }, [isOpen, fetchClientData]);

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

    if (!schema) return;
    const isValid = await methods.trigger(fieldNames);

    if (!isValid) {
      toast({ variant: 'destructive', title: 'Campos Inválidos', description: 'Por favor, corrija os erros antes de salvar.' });
      return;
    }
    
    setIsSaving(true);
    const values = methods.getValues();
    
    let error;

    if (step === 'info' || step === 'address') {
        const addressString = values.cep ? `${values.street}, ${values.number}${values.complement ? `, ${values.complement}` : ''} - ${values.neighborhood}, ${values.city} - ${values.state}, CEP: ${values.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}` : '';
        const submissionData = { ...values, address: addressString };
        const result = await updateClientProfile(client!.id, submissionData);
        error = result.error;
    } else if (step === 'financial') {
        const result = await updateClientFinancials(client!.id, { 
            billing_status: values.billing_status, 
            proposal_id: values.proposal_id, 
            value: values.value,
            payment_day: values.payment_day,
            first_charge_date: values.first_charge_date,
        });
        error = result.error;
    }

    setIsSaving(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: error.message });
    } else {
      toast({ variant: 'default', title: 'Salvo!', description: 'As informações foram atualizadas.', className: 'bg-green-100 border-green-200 text-green-800' });
      setEditingStep(null);
      await fetchClientData();
      onUpdate(); // Notify parent to refetch data
      
      if (step === 'info') setActiveTab('address');
      if (step === 'address') setActiveTab('financial');
    }
  };

  const handleMarkAsPaid = async (chargeId: string) => {
    setIsSaving(true);
    const { error } = await markChargeAsPaid(chargeId);
     if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'Cobrança marcada como paga.' });
      await fetchClientData();
      onUpdate();
    }
    setIsSaving(false);
  }

  const handleDeleteCharge = async (chargeId: string) => {
    setIsSaving(true);
    const { error } = await deleteCharge(chargeId);
     if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'Cobrança excluída.' });
      await fetchClientData();
      onUpdate();
    }
    setIsSaving(false);
  }
  
  const isInfoComplete = clientInfoSchema.safeParse(methods.getValues()).success;
  const isAddressComplete = addressSchema.safeParse(methods.getValues()).success;
  const isFinancialComplete = financialSchema.safeParse(methods.getValues()).success;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-2xl w-full p-0">
            <FormProvider {...methods}>
            {isLoading ? (
                <PageLoadingSkeleton />
            ) : client ? (
                <div className="flex flex-1 flex-col h-full">
                    <SheetHeader className="p-6 space-y-2">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                            <AvatarImage src={client?.avatar_url || ''} alt="Avatar do Cliente" />
                            <AvatarFallback>{(client.full_name || client.company_name || 'C').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <SheetTitle className="text-2xl">{client.full_name || client.company_name || client.company_nar}</SheetTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className={cn(client.billing_status === 'active' ? 'border-green-500 bg-green-500/10 text-green-700' : 'border-gray-500 bg-gray-500/10 text-gray-700')}>{client.billing_status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                                    <Badge variant="secondary">{client.person_type === 'cpf' ? 'Pessoa Física' : 'Pessoa Jurídica'}</Badge>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="px-6 flex-1 flex flex-col">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StepName)} className="w-full mt-2 flex-1 flex flex-col">
                        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                            <TabsTrigger value="info" disabled={editingStep !== null && editingStep !== 'info'}>
                                {isInfoComplete && editingStep !== 'info' && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                                Informações
                            </TabsTrigger>
                            <TabsTrigger value="address" disabled={!isInfoComplete || (editingStep !== null && editingStep !== 'address')}>
                                {isAddressComplete && editingStep !== 'address' && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                                Endereço
                            </TabsTrigger>
                            <TabsTrigger value="contracts" disabled={!isInfoComplete || !isAddressComplete || (editingStep !== null && editingStep !== 'contracts')}>
                                Contratos
                            </TabsTrigger>
                            <TabsTrigger value="financial" disabled={!isInfoComplete || !isAddressComplete || (editingStep !== null && editingStep !== 'financial')}>
                                {isFinancialComplete && editingStep !== 'financial' && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                                Financeiro
                            </TabsTrigger>
                        </TabsList>
                        
                        <div className="flex-1 mt-6 overflow-y-auto">
                            <TabsContent value="info">
                                <InfoStep isEditing={editingStep === 'info'} setEditingStep={setEditingStep} onSave={() => handleSaveStep('info')} isSaving={isSaving} />
                            </TabsContent>
                            <TabsContent value="address">
                                <AddressStep isEditing={editingStep === 'address'} setEditingStep={setEditingStep} onSave={() => handleSaveStep('address')} isSaving={isSaving} />
                            </TabsContent>
                            <TabsContent value="contracts">
                                <ContractsStep 
                                    client={client}
                                    isClientSide={isClientSide}
                                    onUploadSuccess={fetchClientData}
                                />
                            </TabsContent>
                            <TabsContent value="financial">
                                <FinancialStep 
                                    isEditing={editingStep === 'financial'} 
                                    setEditingStep={setEditingStep} 
                                    onSave={() => handleSaveStep('financial')} 
                                    isSaving={isSaving} 
                                    proposals={proposals} 
                                    charges={charges}
                                    onMarkAsPaid={handleMarkAsPaid}
                                    onDeleteCharge={handleDeleteCharge}
                                    isClientSide={isClientSide}
                                />
                            </TabsContent>
                        </div>
                        </Tabs>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p>Cliente não encontrado.</p>
                </div>
            )}
            </FormProvider>
        </SheetContent>
    </Sheet>
  );
}


interface StepProps {
  isEditing: boolean;
  setEditingStep: (step: StepName | null) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

function InfoStep({ isEditing, setEditingStep, onSave, isSaving }: StepProps) {
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
            <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingStep(null)}>Cancelar</Button>
            <Button type="button" onClick={onSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar e Continuar'}</Button>
        </CardFooter>
        </Card>
    );
  }

  // Criar variável específica para o tipo de pessoa no modo de visualização
  const viewPersonType = client?.person_type || 'cpf';

  return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardTitle>Informações do Cliente</CardTitle>
                <CardDescription>
                    {viewPersonType === 'cpf' ? `CPF: ${client?.cpf || 'Não preenchido'}` : `CNPJ: ${client?.cnpj || 'Não preenchido'}`}
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditingStep('info')}><Edit className="mr-2 h-4 w-4" />Editar</Button>
        </CardHeader>
        <CardContent className="space-y-4 text-sm pt-6">
            <p><strong>E-mail:</strong> {client?.email || 'Não preenchido'}</p>
            {viewPersonType === 'cpf' && (
                <>
                    <p><strong>Nome Completo:</strong> {client?.full_name || 'Não preenchido'}</p>
                    <p><strong>Nacionalidade:</strong> {client?.nationality || 'Não preenchido'}</p>
                    <p><strong>Estado Civil:</strong> {client?.civil_status || 'Não preenchido'}</p>
                    <p><strong>Profissão:</strong> {client?.profession || 'Não preenchido'}</p>
                    <p><strong>CPF:</strong> {client?.cpf || 'Não preenchido'}</p>
                </>
            )}
             {viewPersonType === 'cnpj' && (
                <>
                    <p><strong>Nome da Empresa:</strong> {client?.company_name || 'Não preenchido'}</p>
                    <p><strong>CNPJ:</strong> {client?.cnpj || 'Não preenchido'}</p>
                    <p><strong>Representante Legal:</strong> {client?.representative_name || 'Não preenchido'}</p>
                    <p><strong>CPF do Representante:</strong> {client?.representative_cpf || 'Não preenchido'}</p>
                </>
            )}
        </CardContent>
    </Card>
  )
}

function AddressStep({ isEditing, setEditingStep, onSave, isSaving }: StepProps) {
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
                <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditingStep(null)}>Cancelar</Button>
                <Button type="button" onClick={onSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar e Continuar'}</Button>
            </CardFooter>
            </Card>
        )
    }
    
    // Criar endereço a partir dos dados do cliente quando não estiver editando
    const addressParts = client ? parseAddress(client.address) : { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', cep: '' };
    const fullAddress = client?.address ?
        `${addressParts.street}, ${addressParts.number}${addressParts.complement ? `, ${addressParts.complement}` : ''} - ${addressParts.neighborhood}, ${addressParts.city}/${addressParts.state} - CEP: ${addressParts.cep}`
        : 'Não preenchido';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle>Endereço</CardTitle>
                    <CardDescription>{client?.address ? `${addressParts.street}, ${addressParts.number}` : 'Não preenchido'}</CardDescription>
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
    onDeleteCharge: (chargeId: string) => Promise<void>;
    isClientSide: boolean;
}

const getStatusInfo = (status: string, dueDate: string, isClientSide: boolean) => {
    if (!isClientSide) {
      return { text: 'Carregando...', className: 'border-gray-500 bg-gray-500/10 text-gray-700' };
    }
    if (status === 'pago') {
      return { text: 'Pago', className: 'border-green-500 bg-green-500/10 text-green-700' };
    }
    if (isPast(new Date(dueDate))) {
      return { text: 'Atrasado', className: 'border-red-500 bg-red-500/10 text-red-700' };
    }
    return { text: 'Pendente', className: 'border-yellow-500 bg-yellow-500/10 text-yellow-700' };
}

function FinancialStep({ isEditing, setEditingStep, onSave, isSaving, proposals, charges, onMarkAsPaid, onDeleteCharge, isClientSide }: FinancialStepProps) {
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
                                <FormDescription>Para ativar, é necessário um contrato (interno ou externo) anexado na aba "Contratos". Cobranças futuras só serão geradas para clientes com status "Ativo".</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                                    <FormControl><Input type="number" placeholder="10" {...field} value={field.value || ''}/></FormControl>
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
                    
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEditingStep(null)}>Cancelar</Button>
                    <Button type="button" onClick={onSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Configuração'}</Button>
                </CardFooter>
            </Card>
             <ChargeHistory charges={charges} onMarkAsPaid={onMarkAsPaid} onDeleteCharge={onDeleteCharge} isClientSide={isClientSide} />
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
                            Automação de cobrança: {client?.billing_status === 'active' ? 'Ativa' : 'Inativa'}
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingStep('financial')}><Edit className="mr-2 h-4 w-4" />Editar</Button>
                </CardHeader>
                <CardContent className="space-y-4 text-sm pt-6">
                     <p className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Valor Mensal:</strong>&nbsp;R$ {Number(client?.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Vencimento:</strong>&nbsp;Todo dia {client?.payment_day || 'N/A'}
                    </p>
                     {client?.first_charge_date && isClientSide && (
                        <p className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <strong>Início das cobranças:</strong>&nbsp;{format(new Date(client.first_charge_date), 'dd/MM/yyyy')}
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
             <ChargeHistory charges={charges} onMarkAsPaid={onMarkAsPaid} onDeleteCharge={onDeleteCharge} isClientSide={isClientSide} />
        </div>
    )
}

function ChargeHistory({ charges, onMarkAsPaid, onDeleteCharge, isClientSide }: { charges: Cobranca[], onMarkAsPaid: (id: string) => Promise<void>, onDeleteCharge: (id: string) => Promise<void>, isClientSide: boolean }) {
    const [chargeToDelete, setChargeToDelete] = useState<Cobranca | null>(null);
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
                                const status = getStatusInfo(charge.status, charge.due_date, isClientSide);
                                return (
                                <TableRow key={charge.id}>
                                    <TableCell>{isClientSide ? format(new Date(charge.due_date), 'dd/MM/yyyy') : ''}</TableCell>
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
                                                    <DropdownMenuItem className="text-destructive" onClick={() => setChargeToDelete(charge)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Excluir
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
            <AlertDialog open={!!chargeToDelete} onOpenChange={() => setChargeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a cobrança.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            if (chargeToDelete) onDeleteCharge(chargeToDelete.id);
                            setChargeToDelete(null);
                        }}
                        className={cn(buttonVariants({ variant: "destructive" }))}
                    >
                        Sim, excluir cobrança
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

function ContractsStep({ client, isClientSide, onUploadSuccess }: { client: Cliente | null, isClientSide: boolean, onUploadSuccess: () => void }) {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    if (!client) return null;

    const allContracts = [
        ...(client.contratos?.map(c => ({...c, type: 'Crivo'})) || []),
        ...(client.external_contracts?.map(c => ({...c, type: 'Externo'})) || [])
    ].sort((a, b) => new Date((b as any).created_at || (b as ExternalContract).uploaded_at).getTime() - new Date((a as any).created_at || (a as ExternalContract).uploaded_at).getTime());

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Contratos do Cliente</CardTitle>
                    <CardDescription>Visualize ou anexe contratos para ativar as cobranças.</CardDescription>
                </div>
                <Button onClick={() => setIsUploadModalOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" /> Anexar Contrato Externo
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Contrato</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allContracts.length > 0 ? allContracts.map(contract => (
                            <TableRow key={contract.id}>
                                <TableCell className="font-medium">
                                    {contract.type === 'Crivo' ? (contract as any).propostas?.name : (contract as ExternalContract).file_name}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={contract.type === 'Crivo' ? 'default' : 'secondary'}>{contract.type}</Badge>
                                </TableCell>
                                <TableCell>
                                    {isClientSide && format(new Date((contract as any).created_at || (contract as ExternalContract).uploaded_at), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell>
                                    {contract.type === 'Crivo' ? <Badge variant="outline">{ (contract as any).status }</Badge> : <Badge variant="outline" className="border-green-500 text-green-700">Ativo</Badge>}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={contract.type === 'Crivo' ? `/dashboard/contratos/${contract.id}` : (contract as ExternalContract).file_url} target="_blank">Visualizar</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Nenhum contrato encontrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            {client && (
                <UploadContractModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onUploadSuccess={onUploadSuccess}
                    clientId={client.id}
                />
            )}
        </Card>
    );
}
