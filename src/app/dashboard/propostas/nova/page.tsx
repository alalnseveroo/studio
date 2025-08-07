'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createProposal } from '@/lib/actions/propostas'
import { ALL_SERVICES } from '@/lib/constants'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const proposalSchema = z.object({
  name: z.string().min(3, { message: 'O nome da proposta deve ter pelo menos 3 caracteres.' }),
  services: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Você deve selecionar pelo menos um serviço.',
  }),
  payment_type: z.enum(['fixed', 'hourly', 'project'], { required_error: 'Selecione o tipo de remuneração.' }),
  value: z.string().min(1, { message: 'O valor é obrigatório.' }),
  value_in_words: z.string().min(3, { message: 'O valor por extenso é obrigatório.' }),
  payment_day: z.string().min(1, { message: 'O dia do pagamento é obrigatório.' }),
  payment_method: z.string().min(3, { message: 'O método de pagamento é obrigatório.' }),
  contract_duration_type: z.enum(['indefinite', 'definite'], { required_error: 'Selecione a duração do contrato.' }),
  contract_duration_months: z.string().optional(),
  start_date: z.string().min(1, { message: 'A data de início é obrigatória.' }),
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

export default function NovaPropostaPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      name: '',
      services: [],
      payment_type: 'fixed',
      contract_duration_type: 'indefinite',
    },
  })

  const contractDurationType = form.watch('contract_duration_type');

  const onSubmit = async (values: ProposalFormData) => {
    setIsLoading(true)
    
    const { error } = await createProposal(values)

    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Criar Proposta',
        description: error.message,
      })
    } else {
      toast({
        title: 'Proposta Criada!',
        description: 'Sua nova proposta de serviço foi salva com sucesso.',
      })
      router.push('/dashboard/propostas')
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-lg bg-card p-4 shadow-sm sm:gap-6 sm:p-6">
       <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon" className="h-7 w-7">
            <Link href="/dashboard/propostas">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
            </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Criar Nova Proposta
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Nome da Proposta</CardTitle>
              <CardDescription>
                Dê um nome para identificar este conjunto de serviços. Ex: "Pacote Mídias Sociais"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Minha Proposta Personalizada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                            >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="fixed" />
                                </FormControl>
                                <FormLabel className="font-normal">Valor Fixo Mensal</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="hourly" />
                                </FormControl>
                                <FormLabel className="font-normal">Valor por Hora</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="project" />
                                </FormControl>
                                <FormLabel className="font-normal">Valor por Projeto</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="value" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor (R$)</FormLabel>
                            <FormControl><Input type="number" placeholder="1500.00" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="value_in_words" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor por Extenso</FormLabel>
                            <FormControl><Input placeholder="Mil e quinhentos reais" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="payment_day" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dia do Vencimento</FormLabel>
                            <FormControl><Input type="number" placeholder="5" {...field} /></FormControl>
                             <FormDescription>Dia útil de cada mês para o pagamento.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="payment_method" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Método de Pagamento</FormLabel>
                            <FormControl><Input placeholder="Pix, Transferência Bancária..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
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
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                            >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="indefinite" />
                                </FormControl>
                                <FormLabel className="font-normal">Prazo Indeterminado</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="definite" />
                                </FormControl>
                                <FormLabel className="font-normal">Prazo Determinado</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
                {contractDurationType === 'definite' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="contract_duration_months" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duração (meses)</FormLabel>
                                <FormControl><Input type="number" placeholder="6" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="end_date" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data de Término</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                     </div>
                )}
                
                <FormField control={form.control} name="start_date" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Data de Início da Vigência</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="jurisdiction_city" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cidade do Foro</FormLabel>
                            <FormControl><Input placeholder="Sua Cidade" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="jurisdiction_state" render={({ field }) => (
                         <FormItem>
                            <FormLabel>Estado (UF)</FormLabel>
                             <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AC">Acre</SelectItem>
                                        <SelectItem value="AL">Alagoas</SelectItem>
                                        <SelectItem value="AP">Amapá</SelectItem>
                                        <SelectItem value="AM">Amazonas</SelectItem>
                                        <SelectItem value="BA">Bahia</SelectItem>
                                        <SelectItem value="CE">Ceará</SelectItem>
                                        <SelectItem value="DF">Distrito Federal</SelectItem>
                                        <SelectItem value="ES">Espírito Santo</SelectItem>
                                        <SelectItem value="GO">Goiás</SelectItem>
                                        <SelectItem value="MA">Maranhão</SelectItem>
                                        <SelectItem value="MT">Mato Grosso</SelectItem>
                                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                                        <SelectItem value="MG">Minas Gerais</SelectItem>
                                        <SelectItem value="PA">Pará</SelectItem>
                                        <SelectItem value="PB">Paraíba</SelectItem>
                                        <SelectItem value="PR">Paraná</SelectItem>
                                        <SelectItem value="PE">Pernambuco</SelectItem>
                                        <SelectItem value="PI">Piauí</SelectItem>
                                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                                        <นาน value="RN">Rio Grande do Norte</นาน>
                                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                                        <SelectItem value="RO">Rondônia</SelectItem>
                                        <SelectItem value="RR">Roraima</SelectItem>
                                        <SelectItem value="SC">Santa Catarina</SelectItem>
                                        <SelectItem value="SP">São Paulo</SelectItem>
                                        <SelectItem value="SE">Sergipe</SelectItem>
                                        <SelectItem value="TO">Tocantins</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Proposta
          </Button>
        </form>
      </Form>
    </div>
  )
}
