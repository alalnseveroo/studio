
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, User, Building, Search } from 'lucide-react'
import { getClientById, updateClientProfile } from '@/lib/actions/clients'
import { useToast } from '@/hooks/use-toast'
import type { Cliente } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const clientProfileSchema = z.object({
  personType: z.enum(['cpf', 'cnpj'], { required_error: "Você deve selecionar o tipo de pessoa." }),
  // Common fields
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  cep: z.string().min(8, { message: "O CEP é obrigatório e deve ter 8 dígitos."}),
  street: z.string().min(1, { message: "A rua é obrigatória."}),
  number: z.string().min(1, { message: "O número é obrigatório."}),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, { message: "O bairro é obrigatório."}),
  city: z.string().min(1, { message: "A cidade é obrigatória."}),
  state: z.string().min(2, { message: "O estado é obrigatório."}),
  
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
  rg: z.string().optional(),
  cpf: z.string().optional(),
}).refine(data => {
    // Transforma o endereço em uma string única para salvar
    const address = `${data.street}, ${data.number}${data.complement ? `, ${data.complement}` : ''} - ${data.neighborhood}, ${data.city} - ${data.state}, CEP: ${data.cep}`;
    if (data.personType === 'cnpj') {
        return !!data.companyName && !!data.cnpj && !!data.representativeName && !!data.representativeCpf && !!address;
    }
    if (data.personType === 'cpf') {
        return !!data.fullName && !!data.nationality && !!data.civilStatus && !!data.profession && !!data.rg && !!data.cpf && !!address;
    }
    return false;
}, {
  message: "Preencha todos os campos obrigatórios para o tipo de pessoa selecionado.",
  path: ["form"],
});


type ClientFormData = z.infer<typeof clientProfileSchema>;

export default function ClienteEditPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [client, setClient] = useState<Cliente | null>(null);
  const { toast } = useToast();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      email: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  })

  const parseAddress = (addressString: string | null | undefined) => {
    if (!addressString) return {};
    const cepMatch = addressString.match(/CEP: ([\d-]+)/);
    const streetMatch = addressString.match(/^([^,]+),/);
    const numberMatch = addressString.match(/, ([^,]+) -/);
    const neighborhoodMatch = addressString.match(/- ([^,]+),/);
    const cityMatch = addressString.match(/, ([^,]+) -/);
    const stateMatch = addressString.match(/- (\w{2}),/);
    
    // Fallback simple split if regex fails
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
    const { data, error } = await getClientById(clientId)
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Carregar Cliente',
        description: error.message,
      })
    } else if (data) {
      setClient(data)
      const addressParts = parseAddress(data.address);
      form.reset({
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
        rg: data.rg || '',
        cpf: data.cpf || '',
        ...addressParts,
      });
    }
  }, [clientId, toast, form])

  useEffect(() => {
    fetchClientData()
  }, [fetchClientData])


  const personType = form.watch('personType')

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
      form.setValue('email', data.email, { shouldValidate: true });
      form.setValue('cep', data.cep.replace(/\D/g, ''), { shouldValidate: true });
      form.setValue('street', data.logradouro, { shouldValidate: true });
      form.setValue('number', data.numero, { shouldValidate: true });
      form.setValue('neighborhood', data.bairro, { shouldValidate: true });
      form.setValue('city', data.municipio, { shouldValidate: true });
      form.setValue('state', data.uf, { shouldValidate: true });
      toast({ title: 'Sucesso!', description: 'Dados do CNPJ preenchidos.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar CNPJ', description: error.message });
    } finally {
      setIsFetchingCnpj(false);
    }
  };

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


  const onSubmit = async (values: ClientFormData) => {
    setIsLoading(true)
    
    const address = `${values.street}, ${values.number}${values.complement ? `, ${values.complement}` : ''}, ${values.neighborhood}, ${values.city}-${values.state}, CEP: ${values.cep}`;
    const submissionData = { ...values, address };
    
    const { error } = await updateClientProfile(clientId, submissionData);

    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar Perfil do Cliente',
        description: error.message,
      })
    } else {
      toast({
        variant: 'default',
        title: 'Perfil Salvo!',
        description: 'Os dados do cliente foram atualizados com sucesso.',
        className: 'bg-green-100 border-green-200 text-green-800'
      })
    }
  }

  if (!client) {
    return <div className="flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col items-start text-left">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={client.avatar_url || ''} alt="Avatar do Cliente" />
          <AvatarFallback>{(client.full_name || client.company_name || 'C').charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold">{client.full_name || client.company_name}</h2>
        <Badge variant="outline" className="mt-2 border-green-500 bg-green-500/10 text-green-700">Ativo</Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Tipo de Pessoa</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormField
                    control={form.control}
                    name="personType"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                            <FormLabel className="text-base">
                                Selecione o tipo de pessoa
                            </FormLabel>
                            <FormDescription>
                                O cliente é Pessoa Física (CPF) ou Pessoa Jurídica (CNPJ)?
                            </FormDescription>
                            </div>
                            <FormControl>
                            <div className="flex items-center space-x-2">
                                <span className={personType === 'cpf' ? 'font-bold' : ''}>CPF</span>
                                <Switch
                                checked={field.value === 'cnpj'}
                                onCheckedChange={(checked) => field.onChange(checked ? 'cnpj' : 'cpf')}
                                />
                                <span className={personType === 'cnpj' ? 'font-bold' : ''}>CNPJ</span>
                            </div>
                            </FormControl>
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>


          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato e Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail do Cliente</FormLabel>
                    <FormControl><Input type="email" placeholder="email@cliente.com" {...field} /></FormControl>
                    <FormDescription>Este e-mail será usado para enviar o código de assinatura do contrato.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                      <FormItem className="md:col-span-1">
                          <FormLabel>CEP</FormLabel>
                          <div className="flex items-center gap-2">
                          <FormControl>
                              <Input placeholder="00000-000" {...field} />
                          </FormControl>
                          <Button type="button" size="icon" onClick={handleCepSearch} disabled={isFetchingCep}>
                              {isFetchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                          </div>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                      <FormItem className="md:col-span-2">
                          <FormLabel>Rua / Logradouro</FormLabel>
                          <FormControl><Input placeholder="Ex: Rua das Flores" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl><Input placeholder="123" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="complement"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl><Input placeholder="Apto 45" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl><Input placeholder="Centro" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl><Input placeholder="São Paulo" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Estado (UF)</FormLabel>
                          <FormControl><Input placeholder="SP" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
              </div>
            </CardContent>
          </Card>

          {personType === 'cnpj' && (
             <Card>
                <CardHeader>
                    <CardTitle>Dados da Pessoa Jurídica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="companyName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Empresa</FormLabel>
                            <FormControl><Input placeholder="Empresa Contratante LTDA" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="cnpj" render={({ field }) => (
                        <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                             <div className="flex items-center gap-2">
                                <FormControl><Input placeholder="00.000.000/0001-00" {...field} /></FormControl>
                                <Button type="button" size="icon" onClick={handleCnpjSearch} disabled={isFetchingCnpj}>
                                    {isFetchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="representativeName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Representante Legal</FormLabel>
                            <FormControl><Input placeholder="Nome do representante" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="representativeCpf" render={({ field }) => (
                            <FormItem>
                                <FormLabel>CPF do Representante</FormLabel>
                                <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </CardContent>
             </Card>
          )}

          {personType === 'cpf' && (
            <Card>
                <CardHeader>
                    <CardTitle>Dados da Pessoa Física</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl><Input placeholder="Nome completo do cliente" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="nationality" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nacionalidade</FormLabel>
                                <FormControl><Input placeholder="Brasileira" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="civilStatus" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado Civil</FormLabel>
                                <FormControl><Input placeholder="Solteiro(a)" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                     </div>
                     <FormField control={form.control} name="profession" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Profissão</FormLabel>
                            <FormControl><Input placeholder="Profissão do cliente" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="rg" render={({ field }) => (
                            <FormItem>
                                <FormLabel>RG</FormLabel>
                                <FormControl><Input placeholder="00.000.000-0" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="cpf" render={({ field }) => (
                            <FormItem>
                                <FormLabel>CPF</FormLabel>
                                <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
          {form.formState.errors.form && <p className="text-sm font-medium text-destructive">{form.formState.errors.form.message}</p>}
        </form>
      </Form>
    </div>
  )
}

    