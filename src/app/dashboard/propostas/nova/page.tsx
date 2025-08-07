'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
})

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
    },
  })

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
                                        ? field.onChange([...field.value, item.label])
                                        : field.onChange(
                                            field.value?.filter(
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Proposta
          </Button>
        </form>
      </Form>
    </div>
  )
}
