
'use client'

import * as React from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowRight, Loader2, Search } from 'lucide-react'

// Schema for the form
const identificationSchema = z.object({
  fullName: z.string().min(3, { message: 'O nome completo é obrigatório.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  cpf: z.string().min(14, { message: 'O CPF deve ter 11 dígitos.' }),
  phone: z.string().min(14, { message: 'O telefone é obrigatório.' }),
  addCompanyData: z.boolean().default(false),
  cnpj: z.string().optional(),
  companyName: z.string().optional(),
  tradeName: z.string().optional(),
}).refine(data => {
    if (data.addCompanyData) {
        return !!data.cnpj && !!data.companyName;
    }
    return true;
}, {
    message: "Para Pessoa Jurídica, CNPJ e Razão Social são obrigatórios.",
    path: ["cnpj"],
});


type IdentificationFormData = z.infer<typeof identificationSchema>;

export default function IdentificationStepPage() {
  const { toast } = useToast()
  const [isFetchingCnpj, setIsFetchingCnpj] = React.useState(false);

  const form = useForm<IdentificationFormData>({
    resolver: zodResolver(identificationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      cpf: '',
      phone: '',
      addCompanyData: false,
      cnpj: '',
      companyName: '',
      tradeName: '',
    },
    mode: 'onBlur'
  })

  const watchAddCompany = form.watch('addCompanyData')
  
  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
  };
  
  const formatCnpj = (value: string) => {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .substring(0, 18);
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
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
      form.setValue('tradeName', data.nome_fantasia || '', { shouldValidate: true });
      toast({ title: 'Sucesso!', description: 'Dados da empresa preenchidos.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar CNPJ', description: error.message });
    } finally {
      setIsFetchingCnpj(false);
    }
  };


  const onSubmit = (values: IdentificationFormData) => {
    console.log(values)
    // Here you would navigate to the next step, e.g.
    // router.push('/dashboard/cobrancas/nova/configuracao')
  }

  return (
     <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 items-center">
        <div className="w-full max-w-2xl">
           <div className="text-center mb-8">
                <p className="text-muted-foreground">Etapa 1 de 3</p>
                <h1 className="text-3xl font-bold">Primeiro, os dados da pessoa de contato.</h1>
            </div>

            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Dados da Pessoa de Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="fullName" render={({ field }) => (
                            <FormItem><FormLabel>Nome completo</FormLabel><FormControl><Input placeholder="Ex: Maria da Silva" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>E-mail de contato</FormLabel><FormControl><Input type="email" placeholder="maria.silva@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="cpf" render={({ field }) => (
                                <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} onChange={e => field.onChange(formatCpf(e.target.value))} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Contato (Telefone/WhatsApp)</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} onChange={e => field.onChange(formatPhone(e.target.value))} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                         <FormField
                            control={form.control}
                            name="addCompanyData"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                                <FormLabel className="font-normal cursor-pointer" onClick={() => field.onChange(!field.value)}>
                                Adicionar dados de Pessoa Jurídica (PJ)
                                </FormLabel>
                                <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                    </CardContent>
                     <AnimatePresence initial={false}>
                        {watchAddCompany && (
                            <motion.div
                                key="content"
                                initial="collapsed"
                                animate="open"
                                exit="collapsed"
                                variants={{
                                    open: { opacity: 1, height: "auto" },
                                    collapsed: { opacity: 0, height: 0 }
                                }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <CardHeader className="pt-0">
                                    <CardTitle className="text-base">Dados da Empresa</CardTitle>
                                    <CardDescription>Busque pelo CNPJ para preencher (recomendado)</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <FormField control={form.control} name="cnpj" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CNPJ</FormLabel>
                                            <div className="flex items-center gap-2">
                                                <FormControl><Input placeholder="00.000.000/0001-00" {...field} onChange={(e) => field.onChange(formatCnpj(e.target.value))}/></FormControl>
                                                <Button type="button" size="icon" onClick={handleCnpjSearch} disabled={isFetchingCnpj}>{isFetchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <FormField control={form.control} name="companyName" render={({ field }) => (
                                        <FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input placeholder="Empresa Exemplo LTDA" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="tradeName" render={({ field }) => (
                                        <FormItem><FormLabel>Nome Fantasia (opcional)</FormLabel><FormControl><Input placeholder="Nome da Marca" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </CardContent>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit">
                        Ir para Configuração <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
                </form>
            </FormProvider>
        </div>
     </div>
  );
}
