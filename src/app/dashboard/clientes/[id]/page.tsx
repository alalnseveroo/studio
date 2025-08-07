
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, User, Building, Search, CheckCircle, Edit } from 'lucide-react'
import { getClientById, updateClientProfile } from '@/lib/actions/clients'
import { useToast } from '@/hooks/use-toast'
import type { Cliente } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

// Schemas for each step
const clientTypeSchema = z.object({
  personType: z.enum(['cpf', 'cnpj'], { required_error: "Você deve selecionar o tipo de pessoa." }),
});

const clientInfoSchema = z.object({
  personType: z.enum(['cpf', 'cnpj']),
  // Common
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  // PJ Fields
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  representativeName: z.string().optional(),
  representativeCpf: z.string().optional(),
  // PF Fields
  fullName: z.string().optional(),
  nationality: z.string().optional(),
  civilStatus: z.string().optional(),
  profession: z.string().optional(),
  cpf: z.string().optional(),
}).refine(data => {
    if (data.personType === 'cnpj') {
        return !!data.companyName && !!data.cnpj && !!data.representativeName && !!data.representativeCpf;
    }
    if (data.personType === 'cpf') {
        return !!data.fullName && !!data.nationality && !!data.civilStatus && !!data.profession && !!data.cpf;
    }
    return false;
}, {
  message: "Preencha todos os campos obrigatórios para o tipo de pessoa selecionado.",
  path: ["fullName"], // a representative path
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


const combinedSchema = clientTypeSchema.merge(clientInfoSchema).merge(addressSchema);
type ClientFormData = z.infer<typeof combinedSchema>;
type StepName = 'type' | 'info' | 'address';

export default function ClienteEditPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StepName>('type');
  const [editingStep, setEditingStep] = useState<StepName | null>(null);
  const { toast } = useToast();

  const methods = useForm<ClientFormData>({
    resolver: zodResolver(combinedSchema),
    mode: 'onBlur',
    defaultValues: {
      personType: undefined,
      fullName: '',
      email: '',
    },
  });

  const parseAddress = (addressString: string | null | undefined) => {
    if (!addressString) return {};
    const cepMatch = addressString.match(/CEP: ([\d-]+)/);
    const streetMatch = addressString.match(/^([^,]+),/);
    const numberMatch = addressString.match(/, ([^,]+) -/);
    const neighborhoodMatch = addressString.match(/- ([^,]+),/);
    const cityMatch = addressString.match(/, ([^,]+) -/);
    const stateMatch = addressString.match(/- (\w{2}),/);
    const parts = addressString.split(', ');
    return {
      cep: cepMatch ? cepMatch[1].replace('-', '') : '',
      street: streetMatch ? streetMatch[1] : parts[0] || '',
      number: numberMatch ? numberMatch[1] : parts[1] || '',
      neighborhood: neighborhoodMatch ? neighborhoodMatch[1] : parts[2]?.split(' - ')[1] || '',
      city: cityMatch ? cityMatch[1] : parts[3]?.split(' - ')[0] || '',
      state: stateMatch ? stateMatch[1] : parts[3]?.split(' - ')[1] || '',
      complement: addressString.match(/, (.*?) - /)?.[1] || '',
    };
  };

  const fetchClientData = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    const { data, error } = await getClientById(clientId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Carregar Cliente', description: error.message });
      setIsLoading(false);
      return;
    } 
    
    if (data) {
      setClient(data);
      const addressParts = parseAddress(data.address);
      const defaultValues = {
        personType: data.person_type as 'cpf' | 'cnpj' | undefined,
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
        ...addressParts,
      };
      methods.reset(defaultValues);
     
      if (!data.person_type) {
        setEditingStep('type');
        setActiveTab('type');
      } else if (!clientInfoSchema.safeParse(defaultValues).success) {
        setEditingStep('info');
        setActiveTab('info');
      } else if (!addressSchema.safeParse(defaultValues).success) {
        setEditingStep('address');
        setActiveTab('address');
      }
    }
    setIsLoading(false);
  }, [clientId, toast, methods]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const handleSaveStep = async (step: StepName) => {
    let schema;
    let fieldNames: (keyof ClientFormData)[];
    switch(step) {
      case 'type': 
        schema = clientTypeSchema; 
        fieldNames = Object.keys(schema.shape) as (keyof typeof schema.shape)[];
        break;
      case 'info': 
        schema = clientInfoSchema; 
        fieldNames = Object.keys(schema.shape) as (keyof typeof schema.shape)[];
        break;
      case 'address': 
        schema = addressSchema; 
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
    const address = values.cep ? `${values.street}, ${values.number}${values.complement ? `, ${values.complement}` : ''} - ${values.neighborhood}, ${values.city} - ${values.state}, CEP: ${values.cep}` : '';
    
    const submissionData = { ...values, address };
    
    const { error } = await updateClientProfile(clientId, submissionData);
    setIsLoading(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: error.message });
    } else {
      toast({ variant: 'default', title: 'Salvo!', description: 'As informações foram atualizadas.', className: 'bg-green-100 border-green-200 text-green-800' });
      setEditingStep(null);
      await fetchClientData(); // Refresh data to re-evaluate completion status
      
      // Move to next logical tab
      if (step === 'type') setActiveTab('info');
      else if (step === 'info') setActiveTab('address');

    }
  };

  const personType = methods.watch('personType');
  
  const isTypeComplete = clientTypeSchema.safeParse(methods.getValues()).success;
  const isInfoComplete = clientInfoSchema.safeParse(methods.getValues()).success;
  const isAddressComplete = addressSchema.safeParse(methods.getValues()).success;


  if (isLoading && !client) {
    return <div className="flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!client) {
     return <div className="flex items-center justify-center p-6">Cliente não encontrado.</div>;
  }
  
  return (
    <FormProvider {...methods}>
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
            <AvatarImage src={client.avatar_url || ''} alt="Avatar do Cliente" />
            <AvatarFallback>{(client.full_name || client.company_name || 'C').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <h2 className="text-2xl font-bold">{client.full_name || client.company_name}</h2>
                <Badge variant="outline" className="mt-2 border-green-500 bg-green-500/10 text-green-700">Ativo</Badge>
            </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StepName)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100">
             <TabsTrigger value="type" disabled={editingStep !== null && editingStep !== 'type'}>
                {isTypeComplete && editingStep !== 'type' && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                Tipo de Cliente
             </TabsTrigger>
             <TabsTrigger value="info" disabled={!isTypeComplete || (editingStep !== null && editingStep !== 'info')}>
                {isInfoComplete && editingStep !== 'info' && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                Informações
             </TabsTrigger>
             <TabsTrigger value="address" disabled={!isInfoComplete || (editingStep !== null && editingStep !== 'address')}>
                 {isAddressComplete && editingStep !== 'address' && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                 Endereço
             </TabsTrigger>
          </TabsList>
          
          <TabsContent value="type">
            <ClientTypeStep isEditing={editingStep === 'type'} setEditingStep={setEditingStep} onSave={() => handleSaveStep('type')} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="info">
            <InfoStep isEditing={editingStep === 'info'} setEditingStep={setEditingStep} onSave={() => handleSaveStep('info')} isLoading={isLoading} />
          </TabsContent>
           <TabsContent value="address">
            <AddressStep isEditing={editingStep === 'address'} setEditingStep={setEditingStep} onSave={() => handleSaveStep('address')} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </FormProvider>
  );
}


// Step Components
interface StepProps {
  isEditing: boolean;
  setEditingStep: (step: StepName | null) => void;
  onSave: () => Promise<void>;
  isLoading: boolean;
}

function ClientTypeStep({ isEditing, setEditingStep, onSave, isLoading }: StepProps) {
  const methods = useFormContext<ClientFormData>();
  const personType = methods.watch('personType');

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Pessoa</CardTitle>
          <CardDescription>O cliente é Pessoa Física (CPF) ou Pessoa Jurídica (CNPJ)?</CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={methods.control}
            name="personType"
            render={({ field }) => (
              <FormItem>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <RadioGroupItem value="cpf" id="cpf" className="peer sr-only" />
                    <Label htmlFor="cpf" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === 'cpf' && "border-green-500 bg-green-500/10")}>
                      <User className="mb-3 h-6 w-6" /> Pessoa Física
                    </Label>
                  </FormItem>
                   <FormItem>
                    <RadioGroupItem value="cnpj" id="cnpj" className="peer sr-only" />
                    <Label htmlFor="cnpj" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === 'cnpj' && "border-green-500 bg-green-500/10")}>
                      <Building className="mb-3 h-6 w-6" /> Pessoa Jurídica
                    </Label>
                  </FormItem>
                </RadioGroup>
                 <FormMessage className="pt-4" />
              </FormItem>
            )}
          />
        </CardContent>
        <CardContent className="flex justify-end gap-2">
           <Button variant="ghost" onClick={() => setEditingStep(null)}>Cancelar</Button>
           <Button onClick={onSave} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar e Continuar'}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Tipo de Pessoa</CardTitle>
          <CardDescription>{personType === 'cpf' ? 'Pessoa Física (CPF)' : personType === 'cnpj' ? 'Pessoa Jurídica (CNPJ)' : 'Não definido'}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditingStep('type')}><Edit className="mr-2 h-4 w-4" />Editar</Button>
      </CardHeader>
    </Card>
  );
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

  return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardTitle>Informações do Cliente</CardTitle>
                <CardDescription>
                    {personType === 'cpf' ? `CPF: ${methods.getValues('cpf') || 'Não preenchido'}` : `CNPJ: ${methods.getValues('cnpj') || 'Não preenchido'}`}
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditingStep('info')}><Edit className="mr-2 h-4 w-4" />Editar</Button>
        </CardHeader>
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
                <Button type="button" onClick={onSave} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar e Finalizar'}</Button>
            </CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle>Endereço</CardTitle>
                    <CardDescription>{methods.getValues('street') ? `${methods.getValues('street')}, ${methods.getValues('number')} - ${methods.getValues('city')}` : 'Não preenchido'}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditingStep('address')}><Edit className="mr-2 h-4 w-4" />Editar</Button>
            </CardHeader>
        </Card>
    )
}
