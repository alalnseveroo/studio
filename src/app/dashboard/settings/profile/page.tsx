
'use client'

import { useState, useRef, useEffect } from 'react'
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
import { CheckCircle, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { saveProfile, getProfile } from '@/lib/actions/profile'
import { useToast } from '@/hooks/use-toast'
import type { Profile } from '@/lib/types'
import Link from 'next/link'

const profileSchema = z.object({
  personType: z.enum(['cpf', 'cnpj']),
  // PJ Fields
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  // PF Fields
  fullName: z.string().optional(),
  nationality: z.string().optional(),
  civilStatus: z.string().optional(),
  profession: z.string().optional(),
  rg: z.string().optional(),
  cpf: z.string().optional(),
  // Common field
  address: z.string().optional(),
  signature: z.string().optional(),
}).refine(data => {
  if (data.personType === 'cnpj') {
    return !!data.companyName && !!data.cnpj && !!data.address;
  }
  return !!data.fullName && !!data.nationality && !!data.civilStatus && !!data.profession && !!data.rg && !!data.cpf && !!data.address;
}, {
  message: "Preencha todos os campos obrigatórios.",
  path: ["form"],
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const sigCanvas = useRef<SignatureCanvas>(null);
  const { toast } = useToast()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      personType: 'cpf',
    },
  })

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      const { data, error } = await getProfile();
      if (data) {
        if(data.is_completed) {
            setIsSaved(true)
        }
        form.reset({
          personType: data.person_type || 'cpf',
          companyName: data.company_name || '',
          cnpj: data.cnpj || '',
          fullName: data.full_name || '',
          nationality: data.nationality || '',
          civilStatus: data.civil_status || '',
          profession: data.profession || '',
          rg: data.rg || '',
          cpf: data.cpf || '',
          address: data.address || '',
        });
        if (data.signature) {
           setTimeout(() => {
               sigCanvas.current?.fromDataURL(data.signature as string)
           }, 100)
        }
      }
      setIsLoading(false);
    }
    fetchProfile();
  }, [form]);


  const personType = form.watch('personType')

  const onSubmit = async (values: ProfileFormData) => {
    setIsLoading(true)

    const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (!signatureData || sigCanvas.current?.isEmpty()) {
        form.setError('signature', { type: 'manual', message: 'A assinatura é obrigatória.'})
        setIsLoading(false)
        return;
    }

    const data = { ...values, signature: signatureData, is_completed: true };
    
    const { error } = await saveProfile(data);

    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar Perfil',
        description: error.message,
      })
    } else {
      toast({
        title: 'Perfil Salvo!',
        description: 'Seus dados foram salvos e agora você pode gerar contratos.',
      })
      setIsSaved(true)
    }
  }

  const clearSignature = () => {
    sigCanvas.current?.clear();
    form.setValue('signature', '');
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (isSaved) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="flex items-center gap-4">
           <Button asChild variant="outline" size="icon" className="h-7 w-7">
              <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <h1 className="text-lg font-semibold md:text-2xl">Perfil da Contratada</h1>
        </div>
        <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 !text-green-600" />
            <AlertTitle className="text-green-800">Perfil Completo!</AlertTitle>
            <AlertDescription className="text-green-700">
                Seus dados foram salvos. Agora você já pode gerar e assinar contratos.
            </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon" className="h-7 w-7">
            <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
            </Link>
        </Button>
        <h1 className="text-lg font-semibold md:text-2xl">Perfil da Contratada</h1>
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
                        Você está atuando como Pessoa Física (CPF) ou Pessoa Jurídica (CNPJ)?
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
                            <FormLabel>Nome da Empresa ou Nome Completo (MEI)</FormLabel>
                            <FormControl><Input placeholder="Minha Empresa LTDA" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="cnpj" render={({ field }) => (
                        <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl><Input placeholder="00.000.000/0001-00" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Endereço Completo</FormLabel>
                            <FormControl><Input placeholder="Rua, Número, Bairro, CEP, Cidade, Estado" {...field} value={field.value || ''} /></FormControl>
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
                            <FormControl><Input placeholder="Seu nome completo" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="nationality" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nacionalidade</FormLabel>
                                <FormControl><Input placeholder="Brasileira" {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="civilStatus" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado Civil</FormLabel>
                                <FormControl><Input placeholder="Solteiro(a)" {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                     </div>
                     <FormField control={form.control} name="profession" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Profissão</FormLabel>
                            <FormControl><Input placeholder="Assistente Virtual" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="rg" render={({ field }) => (
                            <FormItem>
                                <FormLabel>RG</FormLabel>
                                <FormControl><Input placeholder="00.000.000-0" {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="cpf" render={({ field }) => (
                            <FormItem>
                                <FormLabel>CPF</FormLabel>
                                <FormControl><Input placeholder="000.000.000-00" {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Endereço Completo</FormLabel>
                            <FormControl><Input placeholder="Rua, Número, Bairro, CEP, Cidade, Estado" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
                <CardTitle>Assinatura</CardTitle>
                <CardDescription>Desenhe sua assinatura no campo abaixo. Ela será usada para assinar os contratos digitalmente.</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="signature"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <div className="w-full h-48 rounded-md border border-input bg-background">
                                <SignatureCanvas 
                                    ref={sigCanvas}
                                    penColor='black'
                                    canvasProps={{className: 'w-full h-full'}}
                                    onEnd={() => field.onChange(sigCanvas.current?.toDataURL())}
                                />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                 )} />
                 <Button type="button" variant="outline" size="sm" onClick={clearSignature} className="mt-2">
                    Limpar Assinatura
                 </Button>
            </CardContent>
          </Card>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
                Após salvar, os dados do perfil não poderão ser alterados. Verifique todas as informações com cuidado antes de continuar. Esta ação é irreversível.
            </AlertDescription>
          </Alert>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar e Bloquear Perfil
          </Button>
          {form.formState.errors.form && <p className="text-sm font-medium text-destructive">{form.formState.errors.form.message}</p>}
        </form>
      </Form>
    </div>
  )
}

    