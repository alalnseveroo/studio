'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { getClientById, updateClientProfile } from '@/lib/actions/clients'
import { useToast } from '@/hooks/use-toast'
import type { Cliente } from '@/lib/types'

const clientProfileSchema = z.object({
  personType: z.enum(['cpf', 'cnpj']),
  // PJ Fields
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  representativeName: z.string().optional(),
  representativeRg: z.string().optional(),
  representativeCpf: z.string().optional(),
  // PF Fields
  fullName: z.string().optional(),
  nationality: z.string().optional(),
  civilStatus: z.string().optional(),
  profession: z.string().optional(),
  rg: z.string().optional(),
  cpf: z.string().optional(),
  // Common field
  address: z.string().optional(),
}).refine(data => {
    if (data.personType === 'cnpj') {
        return !!data.companyName && !!data.cnpj && !!data.representativeName && !!data.representativeRg && !!data.representativeCpf && !!data.address;
    }
    return !!data.fullName && !!data.nationality && !!data.civilStatus && !!data.profession && !!data.rg && !!data.cpf && !!data.address;
}, {
  message: "Preencha todos os campos obrigatórios.",
  path: ["form"],
});


type ClientFormData = z.infer<typeof clientProfileSchema>;

export default function ClienteEditPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(false)
  const [client, setClient] = useState<Cliente | null>(null)
  const { toast } = useToast()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      personType: 'cpf',
    },
  })

  const fetchClientData = useCallback(async () => {
    const { data, error } = await getClientById(params.id)
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Carregar Cliente',
        description: error.message,
      })
    } else if (data) {
      setClient(data)
      form.reset({
        personType: data.person_type || 'cpf',
        companyName: data.company_name || '',
        cnpj: data.cnpj || '',
        representativeName: data.representative_name || '',
        representativeRg: data.representative_rg || '',
        representativeCpf: data.representative_cpf || '',
        fullName: data.full_name || '',
        nationality: data.nationality || '',
        civilStatus: data.civil_status || '',
        profession: data.profession || '',
        rg: data.rg || '',
        cpf: data.cpf || '',
        address: data.address || '',
      });
    }
  }, [params.id, toast, form])

  useEffect(() => {
    fetchClientData()
  }, [fetchClientData])


  const personType = form.watch('personType')

  const onSubmit = async (values: ClientFormData) => {
    setIsLoading(true)
    
    const { error } = await updateClientProfile(params.id, values);

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
    <div className="flex flex-1 flex-col gap-4 rounded-lg bg-card p-4 shadow-sm sm:gap-6 sm:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Editar Cliente: {client.full_name || client.company_name}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Contratação</CardTitle>
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
                            <FormControl><Input placeholder="00.000.000/0001-00" {...field} /></FormControl>
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
                         <FormField control={form.control} name="representativeRg" render={({ field }) => (
                            <FormItem>
                                <FormLabel>RG do Representante</FormLabel>
                                <FormControl><Input placeholder="00.000.000-0" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="representativeCpf" render={({ field }) => (
                            <FormItem>
                                <FormLabel>CPF do Representante</FormLabel>
                                <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Endereço Completo</FormLabel>
                            <FormControl><Input placeholder="Rua, Número, Bairro, CEP, Cidade, Estado" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
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
                     <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Endereço Completo</FormLabel>
                            <FormControl><Input placeholder="Rua, Número, Bairro, CEP, Cidade, Estado" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
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
