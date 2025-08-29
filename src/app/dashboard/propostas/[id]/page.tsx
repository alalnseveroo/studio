
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ArrowLeft, Loader2, DollarSign, Calendar, FileText, CheckCircle, Edit, Save, Trash2, Plus, X } from 'lucide-react'
import { getProposals, updateProposal } from '@/lib/actions/propostas'
import type { Proposta } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format, parseISO } from 'date-fns'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ALL_SERVICES } from '@/lib/constants'

const proposalSchema = z.object({
  name: z.string().min(3, { message: 'O nome da proposta deve ter pelo menos 3 caracteres.' }),
  services: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Você deve selecionar pelo menos um serviço.',
  }),
  payment_type: z.enum(['fixed', 'hourly', 'project'], { required_error: 'Selecione o tipo de remuneração.' }),
  value: z.coerce.number().min(0.01, { message: 'O valor é obrigatório.' }),
  value_in_words: z.string().min(3, { message: 'O valor por extenso é obrigatório.' }),
  payment_day: z.coerce.number().min(1, 'Dia inválido.').max(31, 'Dia inválido.'),
  payment_method: z.string().min(3, { message: 'O método de pagamento é obrigatório.' }),
  contract_duration_type: z.enum(['indefinite', 'definite'], { required_error: 'Selecione a duração do contrato.' }),
  contract_duration_months: z.coerce.number().optional(),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'A data de início é obrigatória.'}),
  end_date: z.string().optional(),
  jurisdiction_city: z.string().min(3, { message: 'A cidade do foro é obrigatória.' }),
  jurisdiction_state: z.string().min(2, { message: 'O estado do foro é obrigatório.' }),
}).refine(data => {
    if (data.contract_duration_type === 'definite') {
        return !!data.contract_duration_months && !!data.end_date;
    }
    return true;
}, {
    message: "Para contratos com prazo determinado, a duração em meses e a data de término são obrigatórias.",
    path: ["contract_duration_months"],
});

type ProposalFormData = z.infer<typeof proposalSchema>;

export default function PropostaDetailPage() {
  const [proposal, setProposal] = useState<Proposta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const proposalId = params.id as string

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      name: '',
      services: [],
      payment_type: 'fixed',
      value: 0,
      value_in_words: '',
      payment_day: 1,
      payment_method: '',
      contract_duration_type: 'indefinite',
      contract_duration_months: undefined,
      start_date: '',
      end_date: '',
      jurisdiction_city: '',
      jurisdiction_state: '',
    },
  });

  const contractDurationType = form.watch('contract_duration_type');

  const fetchProposal = useCallback(async () => {
    setIsLoading(true)
    const { data } = await getProposals()
    const foundProposal = data?.find(p => p.id === proposalId) || null
    
    if (foundProposal) {
        setProposal(foundProposal);
        form.reset({
            name: foundProposal.name || '',
            services: foundProposal.services || [],
            payment_type: foundProposal.payment_type || 'fixed',
            value: foundProposal.value || 0,
            value_in_words: foundProposal.value_in_words || '',
            payment_day: foundProposal.payment_day || 1,
            payment_method: foundProposal.payment_method || '',
            contract_duration_type: foundProposal.contract_duration_type || 'indefinite',
            contract_duration_months: foundProposal.contract_duration_months || undefined,
            start_date: foundProposal.start_date ? format(parseISO(foundProposal.start_date), 'yyyy-MM-dd') : '',
            end_date: foundProposal.end_date ? format(parseISO(foundProposal.end_date), 'yyyy-MM-dd') : '',
            jurisdiction_city: foundProposal.jurisdiction_city || '',
            jurisdiction_state: foundProposal.jurisdiction_state || '',
        });
    } else {
        setProposal(null);
    }
    
    setIsLoading(false)
  }, [proposalId, form])

  useEffect(() => {
    fetchProposal()
  }, [fetchProposal])
  
  const onSubmit = async (values: ProposalFormData) => {
    setIsSaving(true);
    const result = await updateProposal(proposalId, values);
    setIsSaving(false);

    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar',
            description: result.error.message,
        });
    } else {
        toast({
            title: 'Proposta Atualizada!',
            description: 'As alterações foram salvas com sucesso.',
            className: 'bg-green-100 border-green-200 text-green-800'
        });
        await fetchProposal();
    }
  }

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!proposal) {
    return (
       <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Proposta não encontrada
          </h3>
          <p className="text-sm text-muted-foreground">
            A proposta que você está procurando não existe ou foi removida.
          </p>
           <Button className="mt-4" onClick={() => router.push('/dashboard/propostas')}>Voltar para Propostas</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-4">
         <Button asChild variant="outline" size="icon" className="h-7 w-7">
            <Link href="/dashboard/propostas">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
            </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Editar Proposta
        </h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
             <Card>
                <CardHeader>
                <CardTitle>Detalhes da Proposta</CardTitle>
                <CardDescription>
                    Edite as informações da sua proposta de serviço.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome da Proposta</FormLabel>
                        <FormControl><Input placeholder="Pacote Mídias Sociais" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                </CardContent>
            </Card>

            <Card>
            <CardHeader>
              <CardTitle>Serviços Incluídos</CardTitle>
              <CardDescription>
                Selecione todos os serviços que farão parte desta proposta.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                control={form.control}
                name="services"
                render={() => (
                    <FormItem className="space-y-3">
                    {ALL_SERVICES.map((item) => (
                        <FormField
                        key={item.id}
                        control={form.control}
                        name="services"
                        render={({ field }) => {
                            return (
                            <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                            >
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(item.label)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...(field.value || []), item.label])
                                        : field.onChange(
                                            (field.value || [])?.filter(
                                            (value) => value !== item.label
                                            )
                                        )
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal">
                                {item.label}
                                </FormLabel>
                            </FormItem>
                            )
                        }}
                        />
                    ))}
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
                <CardTitle>Remuneração e Pagamento</CardTitle>
            </CardHeader>
             <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="payment_type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Tipo de Remuneração</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="fixed" /></FormControl><FormLabel className="font-normal">Valor Fixo Mensal</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="hourly" /></FormControl><FormLabel className="font-normal">Valor por Hora</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="project" /></FormControl><FormLabel className="font-normal">Valor por Projeto</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="value" render={({ field }) => (
                        <FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" placeholder="1500.00" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="value_in_words" render={({ field }) => (
                        <FormItem><FormLabel>Valor por Extenso</FormLabel><FormControl><Input placeholder="Mil e quinhentos reais" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="payment_day" render={({ field }) => (
                        <FormItem><FormLabel>Dia do Vencimento</FormLabel><FormControl><Input type="number" placeholder="5" {...field} /></FormControl><FormDescription>Dia útil de cada mês para o pagamento.</FormDescription><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="payment_method" render={({ field }) => (
                        <FormItem><FormLabel>Método de Pagamento</FormLabel><FormControl><Input placeholder="Pix, Transferência Bancária..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
                <CardTitle>Prazo e Vigência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <FormField
                    control={form.control}
                    name="contract_duration_type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Duração do Contrato</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="indefinite" /></FormControl><FormLabel className="font-normal">Prazo Indeterminado</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="definite" /></FormControl><FormLabel className="font-normal">Prazo Determinado</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
                {contractDurationType === 'definite' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="contract_duration_months" render={({ field }) => (
                            <FormItem><FormLabel>Duração (meses)</FormLabel><FormControl><Input type="number" placeholder="6" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="end_date" render={({ field }) => (
                            <FormItem><FormLabel>Data de Término</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
                        )} />
                     </div>
                )}
                
                <FormField control={form.control} name="start_date" render={({ field }) => (
                    <FormItem><FormLabel>Data de Início da Vigência</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
                )} />

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="jurisdiction_city" render={({ field }) => (
                        <FormItem><FormLabel>Cidade do Foro</FormLabel><FormControl><Input placeholder="Sua Cidade" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="jurisdiction_state" render={({ field }) => (
                         <FormItem><FormLabel>Estado (UF)</FormLabel>
                             <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AC">Acre</SelectItem><SelectItem value="AL">Alagoas</SelectItem><SelectItem value="AP">Amapá</SelectItem><SelectItem value="AM">Amazonas</SelectItem><SelectItem value="BA">Bahia</SelectItem><SelectItem value="CE">Ceará</SelectItem><SelectItem value="DF">Distrito Federal</SelectItem><SelectItem value="ES">Espírito Santo</SelectItem><SelectItem value="GO">Goiás</SelectItem><SelectItem value="MA">Maranhão</SelectItem><SelectItem value="MT">Mato Grosso</SelectItem><SelectItem value="MS">Mato Grosso do Sul</SelectItem><SelectItem value="MG">Minas Gerais</SelectItem><SelectItem value="PA">Pará</SelectItem><SelectItem value="PB">Paraíba</SelectItem><SelectItem value="PR">Paraná</SelectItem><SelectItem value="PE">Pernambuco</SelectItem><SelectItem value="PI">Piauí</SelectItem><SelectItem value="RJ">Rio de Janeiro</SelectItem><SelectItem value="RN">Rio Grande do Norte</SelectItem><SelectItem value="RS">Rio Grande do Sul</SelectItem><SelectItem value="RO">Rondônia</SelectItem><SelectItem value="RR">Roraima</SelectItem><SelectItem value="SC">Santa Catarina</SelectItem><SelectItem value="SP">São Paulo</SelectItem><SelectItem value="SE">Sergipe</SelectItem><SelectItem value="TO">Tocantins</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alterações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
