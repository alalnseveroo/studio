
'use client'

import * as React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Stepper, Step, StepLabel } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, User, Briefcase, Award, MessageSquare, Link as LinkIcon, Check, ArrowRight, ArrowLeft, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TagsInput } from '@/components/ui/tags-input'


const STEPS = [
  { id: 'info', label: 'Informações Pessoais', icon: User },
  { id: 'bio', label: 'Apresentação e Serviços', icon: Briefcase },
  { id: 'credentials', label: 'Credenciais e Depoimentos', icon: Award },
  { id: 'finalize', label: 'Finalizar', icon: LinkIcon },
]

const publicProfileSchema = z.object({
  // Step 1
  slug: z.string().min(3, 'A URL deve ter pelo menos 3 caracteres.'),
  fullName: z.string().min(3, 'O nome é obrigatório.'),
  title: z.string().min(5, 'O título é obrigatório.'),
  location: z.string().min(3, 'A localização é obrigatória.'),
  availability: z.enum(['Disponível', 'Vagas Limitadas']),
  responseTime: z.string().min(1, 'O tempo de resposta é obrigatório.'),
  
  // Step 2
  bio: z.string().min(20, 'A apresentação deve ter pelo menos 20 caracteres.'),
  specialties: z.array(z.object({ value: z.string(), label: z.string() })).min(1, 'Adicione pelo menos uma especialidade.'),
  services: z.array(z.object({ value: z.string(), label: z.string() })).min(1, 'Adicione pelo menos um serviço.'),
  tools: z.array(z.object({ value: z.string(), label: z.string() })).min(1, 'Adicione pelo menos uma ferramenta.'),

  // Step 3
  certifications: z.array(z.object({ text: z.string().min(3, 'A certificação não pode estar vazia.') })).min(1, 'Adicione pelo menos uma certificação.'),
  testimonials: z.array(z.object({
    client: z.string().min(3, 'O nome do cliente é obrigatório.'),
    text: z.string().min(10, 'O depoimento é obrigatório.'),
  })).min(1, 'Adicione pelo menos um depoimento.'),
});

type PublicProfileData = z.infer<typeof publicProfileSchema>;

export default function PublicProfilePage() {
  const [activeStep, setActiveStep] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<PublicProfileData>({
    resolver: zodResolver(publicProfileSchema),
    defaultValues: {
        slug: '',
        fullName: '',
        title: '',
        location: '',
        availability: 'Disponível',
        responseTime: '',
        bio: '',
        specialties: [],
        services: [],
        tools: [],
        certifications: [{ text: '' }],
        testimonials: [{ client: '', text: '' }],
    },
  });

  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({
    control: form.control,
    name: "certifications",
  });

  const { fields: testiFields, append: appendTesti, remove: removeTesti } = useFieldArray({
    control: form.control,
    name: "testimonials",
  });
  
  const handleNext = async () => {
     // Validação virá aqui
     setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const onSubmit = (data: PublicProfileData) => {
    setIsLoading(true);
    console.log(data);
    // Simular salvamento
    setTimeout(() => {
        setIsLoading(false);
        toast({ title: "Perfil Salvo!", description: "Seu perfil público foi atualizado com sucesso."})
    }, 1500)
  }
  
  return (
     <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
       <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold md:text-3xl">Seu Perfil Público</h1>
          <p className="text-muted-foreground">Preencha os campos para ser encontrada por novos clientes.</p>
      </div>

        <Stepper activeStep={activeStep} className="mb-12">
            {STEPS.map((step, index) => (
                <Step key={step.id}>
                    <StepLabel icon={step.icon}>{step.label}</StepLabel>
                </Step>
            ))}
        </Stepper>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {activeStep === 0 && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Informações Básicas</CardTitle>
                            <CardDescription>Como você se apresenta ao mundo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField control={form.control} name="fullName" render={({ field }) => (
                                <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Ana Carolina Silva" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Título Profissional</FormLabel><FormControl><Input placeholder="Especialista em Gestão Médica" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem><FormLabel>Localização</FormLabel><FormControl><Input placeholder="São Paulo, SP" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                               <FormField control={form.control} name="availability" render={({ field }) => (
                                    <FormItem><FormLabel>Disponibilidade</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Disponível">Disponível</SelectItem>
                                                <SelectItem value="Vagas Limitadas">Vagas Limitadas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    <FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="responseTime" render={({ field }) => (
                                    <FormItem><FormLabel>Tempo de Resposta</FormLabel><FormControl><Input placeholder="2h" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </CardContent>
                     </Card>
                )}

                 {activeStep === 1 && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Apresentação e Habilidades</CardTitle>
                            <CardDescription>Descreva seus serviços e ferramentas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="bio" render={({ field }) => (
                                <FormItem><FormLabel>Apresentação / Bio</FormLabel><FormControl><Textarea rows={4} placeholder="Especialista em gestão médica com 5+ anos de experiência..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="specialties" render={({ field }) => (
                                <FormItem><FormLabel>Especialidades</FormLabel><FormControl><TagsInput placeholder="Adicione especialidades..." tags={field.value} setTags={field.onChange} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="services" render={({ field }) => (
                                <FormItem><FormLabel>Serviços Prestados</FormLabel><FormControl><TagsInput placeholder="Adicione serviços..." tags={field.value} setTags={field.onChange} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="tools" render={({ field }) => (
                                <FormItem><FormLabel>Ferramentas que Domina</FormLabel><FormControl><TagsInput placeholder="Adicione ferramentas..." tags={field.value} setTags={field.onChange} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </CardContent>
                     </Card>
                )}

                 {activeStep === 2 && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Credenciais e Depoimentos</CardTitle>
                            <CardDescription>Mostre sua autoridade e prova social.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <FormLabel>Certificações</FormLabel>
                                {certFields.map((field, index) => (
                                    <FormField
                                    key={field.id}
                                    control={form.control}
                                    name={`certifications.${index}.text`}
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 mt-2">
                                            <FormControl><Input placeholder="Gestão em Saúde - FGV" {...field} /></FormControl>
                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeCert(index)} disabled={certFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                                        </FormItem>
                                    )}
                                    />
                                ))}
                                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendCert({ text: '' })}><Plus className="mr-2 h-4 w-4"/>Adicionar Certificação</Button>
                            </div>
                             <Separator />
                            <div>
                                <FormLabel>Depoimentos</FormLabel>
                                {testiFields.map((field, index) => (
                                    <div key={field.id} className="mt-2 space-y-2 rounded-md border p-4 relative">
                                        <FormField control={form.control} name={`testimonials.${index}.client`} render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Nome do Cliente</FormLabel><FormControl><Input placeholder="Dr. Carlos Mendes" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name={`testimonials.${index}.text`} render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Depoimento</FormLabel><FormControl><Textarea rows={3} placeholder="Ana revolucionou meu consultório..." {...field} /></FormControl></FormItem>
                                        )} />
                                         <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeTesti(index)} disabled={testiFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                                 <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendTesti({ client: '', text: '' })}><Plus className="mr-2 h-4 w-4"/>Adicionar Depoimento</Button>
                            </div>
                        </CardContent>
                     </Card>
                )}

                 {activeStep === 3 && (
                     <Card>
                        <CardHeader>
                            <CardTitle>URL Personalizada</CardTitle>
                            <CardDescription>Defina seu link único para compartilhar seu perfil.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField control={form.control} name="slug" render={({ field }) => (
                                <FormItem><FormLabel>Seu link</FormLabel>
                                    <div className="flex items-center">
                                        <span className="text-sm text-muted-foreground rounded-l-md border border-r-0 bg-muted px-3 py-2">crivo.com.br/</span>
                                        <FormControl><Input placeholder="ana-silva" {...field} className="rounded-l-none" /></FormControl>
                                    </div>
                                <FormMessage /></FormItem>
                            )} />
                        </CardContent>
                     </Card>
                 )}


                 <div className="flex justify-between items-center pt-4">
                    <Button type="button" variant="outline" onClick={handleBack} disabled={activeStep === 0 || isLoading}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    {activeStep < STEPS.length - 1 ? (
                        <Button type="button" onClick={handleNext} disabled={isLoading}>
                             Avançar <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                         <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Salvar Perfil
                        </Button>
                    )}
                </div>
            </form>
        </Form>
    </div>
  )
}
