
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, Loader2, ArrowLeft, ArrowRight, User, Building, MapPin, PencilLine, PartyPopper, Search, Info, Check } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { saveProfile, getProfile } from '@/lib/actions/profile'
import { useToast } from '@/hooks/use-toast'
import type { Profile } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'


const STEPS = {
  TYPE: 1,
  PERSONAL: 2,
  COMPANY: 3,
  ADDRESS: 4,
  SIGNATURE: 5,
};

const profileSchema = z.object({
  personType: z.enum(['cpf', 'cnpj'], { required_error: "Selecione o tipo de pessoa."}),
  sex: z.enum(['male', 'female'], { required_error: 'Por favor, selecione o sexo.' }),
  
  // PF Fields
  fullName: z.string().min(3, 'O nome completo é obrigatório.'),
  nationality: z.string().min(3, 'A nacionalidade é obrigatória.'),
  cpf: z.string().min(11, 'O CPF é obrigatório.'),
  phone: z.string().min(10, 'O telefone é obrigatório.'),
  
  // PJ Fields
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  
  // Address Fields
  cep: z.string().min(8, 'O CEP é obrigatório.'),
  street: z.string().min(3, 'A rua é obrigatória.'),
  number: z.string().min(1, 'O número é obrigatório.'),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, 'O bairro é obrigatório.'),
  city: z.string().min(3, 'A cidade é obrigatória.'),
  state: z.string().min(2, 'O estado é obrigatório.'),

  // Signature
  signature: z.string().optional(),
}).refine(data => {
    if (data.personType === 'cnpj') {
        return !!data.companyName && !!data.cnpj;
    }
    return true;
}, {
    message: "Para Pessoa Jurídica, Nome da Empresa e CNPJ são obrigatórios.",
    path: ["companyName"],
});


export type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [currentStep, setCurrentStep] = useState(STEPS.TYPE);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const { toast } = useToast()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: {
      personType: 'cpf',
      sex: undefined,
      fullName: '',
      nationality: '',
      cpf: '',
      phone: '',
      companyName: '',
      cnpj: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      signature: '',
    },
  })

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      const { data } = await getProfile();
      if (data) {
        if(data.is_completed) {
            setIsSaved(true)
        } else {
            const parsed = profileSchema.safeParse(data);
            if (parsed.success) {
                setCurrentStep(STEPS.SIGNATURE);
            }
            form.reset({
                personType: data.person_type || 'cpf',
                sex: data.sex,
                fullName: data.full_name || '',
                nationality: data.nationality || '',
                cpf: data.cpf || '',
                phone: data.phone || '',
                companyName: data.company_name || '',
                cnpj: data.cnpj || '',
                cep: data.address?.match(/CEP: ([\d-]+)/)?.[1].replace(/\D/g, '') || '',
                street: data.address?.split(',')[0] || '',
                number: data.address?.split(',')[1]?.trim().split(' ')[0] || '',
                neighborhood: data.address?.split('-')[1]?.split(',')[0]?.trim() || '',
                city: data.address?.split(',').slice(-2, -1)[0]?.trim() || '',
                state: data.address?.split('-').slice(-1)[0]?.trim().split(',')[0] || '',
            });
             if (data.signature) {
                setTimeout(() => sigCanvas.current?.fromDataURL(data.signature as string), 100);
            }
        }
      }
      setIsLoading(false);
    }
    fetchProfile();
  }, [form]);

  const personType = form.watch('personType');
  const maxSteps = personType === 'cpf' ? 4 : 5; // PF: Type, Personal, Address, Signature. PJ: Type, Personal, Company, Address, Signature
  
  const stepFields: Record<number, (keyof ProfileFormData)[]> = {
    [STEPS.TYPE]: ['personType'],
    [STEPS.PERSONAL]: ['sex', 'fullName', 'nationality', 'cpf', 'phone'],
    [STEPS.COMPANY]: ['companyName', 'cnpj'],
    [STEPS.ADDRESS]: ['cep', 'street', 'number', 'neighborhood', 'city', 'state'],
    [STEPS.SIGNATURE]: ['signature'],
  };

  const getStepForPersonType = (step: number) => {
    if (personType === 'cpf') {
      if (step === STEPS.COMPANY) return STEPS.ADDRESS;
      if (step === STEPS.ADDRESS) return STEPS.SIGNATURE;
    }
    return step;
  }

  const handleNext = async () => {
    const fieldsToValidate = stepFields[currentStep];
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      if (currentStep === getStepForPersonType(STEPS.SIGNATURE)) {
        await onSubmit(form.getValues());
      } else {
        setCurrentStep(prev => getStepForPersonType(prev + 1));
      }
    }
  }

  const handleBack = () => {
    if (currentStep > STEPS.TYPE) {
      setCurrentStep(prev => {
        if (personType === 'cpf' && prev === STEPS.ADDRESS) return STEPS.PERSONAL;
        return prev - 1
      });
    }
  }

  const onSubmit = async (values: ProfileFormData) => {
    setIsLoading(true);

    const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (!signatureData || sigCanvas.current?.isEmpty()) {
        form.setError('signature', { type: 'manual', message: 'A assinatura é obrigatória.'})
        setIsLoading(false);
        return;
    }
    
    const address = `${values.street}, ${values.number}${values.complement ? `, ${values.complement}` : ''} - ${values.neighborhood}, ${values.city} - ${values.state}, CEP: ${values.cep}`;

    const data = { ...values, signature: signatureData, address, is_completed: true };
    
    const { error } = await saveProfile(data);

    setIsLoading(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Salvar Perfil', description: error.message });
    } else {
      toast({ title: 'Perfil Salvo!', description: 'Seus dados foram salvos e agora você pode usar o sistema.' });
      setIsSaved(true);
    }
  }

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (isSaved) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
        <Image 
            src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/Zero%20Tasks%203.png" 
            alt="Proposta de Serviço" 
            width={150} 
            height={150} 
            className="size-[150px]"
        />
        <h1 className="text-2xl font-bold">Incrível. Agora seu perfil pode criar sua primeira Proposta de Serviço!</h1>
        <p className="max-w-xl text-muted-foreground">
            Como funciona? Você cria uma proposta com valores, serviços e prazos pré-definidos uma única vez e pode usar quantas vezes quiser. Esse é o segundo passo para automatizar cobranças e fechar contratos.
            <br/><br/>
            Vamos começar!
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/propostas/nova">
            Criar minha primeira Proposta de Serviço
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-12 items-start">
                {/* Left Column */}
                <div className="hidden md:flex flex-col items-start text-left sticky top-10">
                    <Image 
                        src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/Welcome%202.png" 
                        alt="Boas-vindas"
                        width={350}
                        height={350}
                        className="size-[350px] mb-6"
                    />
                    <h1 className="text-3xl font-bold">Seja bem-vindo(a) à Crivo!</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Para começar, vamos configurar seu perfil. Esta é a etapa mais importante para garantir que seus contratos e cobranças sejam emitidos corretamente.
                    </p>
                </div>

                {/* Right Column */}
                <div className="flex flex-col">
                    {currentStep === STEPS.TYPE && (
                        <div>
                             <h2 className="text-xl font-semibold mb-2">Como você irá prestar os serviços?</h2>
                             <p className="text-muted-foreground mb-6">Escolha o tipo de perfil que melhor representa você ou seu negócio.</p>
                             <FormField
                                control={form.control}
                                name="personType"
                                render={({ field }) => (
                                    <FormItem className="space-y-4">
                                    <FormControl>
                                        <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="grid grid-cols-1 gap-4"
                                        >
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem value="cpf" id="cpf" className="sr-only peer" />
                                                </FormControl>
                                                <FormLabel htmlFor="cpf" className={cn(
                                                    "flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all",
                                                    "peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:shadow-md"
                                                )}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-base">Pessoa Física</span>
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                                            field.value === 'cpf' ? "bg-green-500 border-green-500" : "border-muted-foreground"
                                                        )}>
                                                        {field.value === 'cpf' && <Check className="w-4 h-4 text-white" />}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-normal text-muted-foreground">
                                                    Para quem atua como profissional autônoma. Seus contratos serão emitidos em seu nome e as cobranças PIX estarão vinculadas diretamente ao seu CPF. É o caminho mais simples para quem está começando.
                                                    </p>
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem value="cnpj" id="cnpj" className="sr-only peer" />
                                                </FormControl>
                                                <FormLabel htmlFor="cnpj" className={cn(
                                                    "flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all",
                                                    "peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:shadow-md"
                                                )}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-base">Pessoa Jurídica</span>
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                                            field.value === 'cnpj' ? "bg-green-500 border-green-500" : "border-muted-foreground"
                                                        )}>
                                                        {field.value === 'cnpj' && <Check className="w-4 h-4 text-white" />}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-normal text-muted-foreground">
                                                        Para quem já tem uma empresa formalizada (MEI, etc.). Seus contratos e as cobranças PIX serão vinculados ao seu CNPJ, o que transmite mais profissionalismo e separa suas finanças pessoais das do seu negócio.
                                                    </p>
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Alert variant="default" className="mt-6">
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    Atenção: Após avançar, esta escolha não poderá ser alterada. Certifique-se de selecionar a opção correta para suas necessidades.
                                </AlertDescription>
                            </Alert>
                            <Button type="button" onClick={() => setCurrentStep(STEPS.PERSONAL)} className="w-full mt-8">
                                Avançar para o Preenchimento <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {currentStep > STEPS.TYPE && (
                        <div className="space-y-8">
                            <div className="space-y-6">
                                {currentStep === STEPS.PERSONAL && <PersonalStep form={form} />}
                                {personType === 'cnpj' && currentStep === STEPS.COMPANY && <CompanyStep form={form} />}
                                {currentStep === getStepForPersonType(STEPS.ADDRESS) && <AddressStep form={form} />}
                                {currentStep === getStepForPersonType(STEPS.SIGNATURE) && <SignatureStep form={form} sigCanvas={sigCanvas} />}
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                                </Button>
                                <Button type="button" onClick={handleNext} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (currentStep === getStepForPersonType(STEPS.SIGNATURE) ? 'Salvar Perfil' : 'Avançar')}
                                    {currentStep !== getStepForPersonType(STEPS.SIGNATURE) && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </Form>
    </div>
  )
}

// Step Components

const StepHeader = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex flex-row items-start gap-4 space-y-0 mb-6">
        <div className="p-3 bg-muted rounded-full">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    </div>
);


const PersonalStep = ({ form }: { form: any }) => (
    <div>
        <StepHeader icon={User} title="Dados Pessoais" description="Estas informações aparecerão no contrato." />
        <div className="space-y-4">
             <FormField control={form.control} name="fullName" render={({ field, fieldState }) => (
                <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Seu nome completo" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="nationality" render={({ field, fieldState }) => (
                    <FormItem><FormLabel>Nacionalidade</FormLabel><FormControl><Input placeholder="Brasileira" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="cpf" render={({ field, fieldState }) => (
                    <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl></FormItem>
                )} />
            </div>
             <FormField control={form.control} name="phone" render={({ field, fieldState }) => (
                <FormItem><FormLabel>Telefone (com DDD)</FormLabel><FormControl><Input placeholder="(11) 99999-9999" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl></FormItem>
            )} />
             <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>Sexo</FormLabel>
                    <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                        <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="female" /></FormControl>
                        <FormLabel className="font-normal">Feminino</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="male" /></FormControl>
                        <FormLabel className="font-normal">Masculino</FormLabel>
                        </FormItem>
                    </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
    </div>
);

const CompanyStep = ({ form }: { form: any }) => {
    const [isFetching, setIsFetching] = useState(false);
    const { toast } = useToast();

    const handleCnpjSearch = async () => {
        const cnpj = form.getValues('cnpj')?.replace(/\D/g, '');
        if (!cnpj || cnpj.length !== 14) {
            toast({ variant: 'destructive', title: 'CNPJ Inválido', description: 'O CNPJ deve ter 14 dígitos.' });
            return;
        }
        setIsFetching(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            if (!response.ok) throw new Error('Não foi possível buscar os dados do CNPJ.');
            const data = await response.json();
            form.setValue('companyName', data.razao_social, { shouldValidate: true });
            form.setValue('street', data.logradouro, { shouldValidate: true });
            form.setValue('number', data.numero, { shouldValidate: true });
            form.setValue('complement', data.complemento, { shouldValidate: true });
            form.setValue('neighborhood', data.bairro, { shouldValidate: true });
            form.setValue('city', data.municipio, { shouldValidate: true });
            form.setValue('state', data.uf, { shouldValidate: true });
            form.setValue('cep', data.cep.replace(/\D/g, ''), { shouldValidate: true });
            toast({ title: 'Sucesso!', description: 'Dados da empresa preenchidos.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao buscar CNPJ', description: error.message });
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <div>
            <StepHeader icon={Building} title="Dados da Empresa" description="Preencha os dados do seu CNPJ." />
            <div className="space-y-4">
                 <FormField control={form.control} name="cnpj" render={({ field, fieldState }) => (
                    <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <div className="flex items-center gap-2">
                           <FormControl><Input placeholder="00.000.000/0001-00" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl>
                           <Button type="button" size="icon" onClick={handleCnpjSearch} disabled={isFetching}>
                                {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                           </Button>
                        </div>
                    </FormItem>
                )} />
                <FormField control={form.control} name="companyName" render={({ field, fieldState }) => (
                    <FormItem><FormLabel>Nome da Empresa (Razão Social)</FormLabel><FormControl><Input placeholder="Minha Empresa LTDA" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl></FormItem>
                )} />
            </div>
        </div>
    );
};


const AddressStep = ({ form }: { form: any }) => {
    const [isFetching, setIsFetching] = useState(false);
    const { toast } = useToast();
    
    const handleCepSearch = async () => {
        const cep = form.getValues('cep')?.replace(/\D/g, '');
        if (!cep || cep.length !== 8) {
            toast({ variant: 'destructive', title: 'CEP Inválido', description: 'O CEP deve ter 8 dígitos.' });
            return;
        }
        setIsFetching(true);
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
            setIsFetching(false);
        }
    };

    return (
        <div>
            <StepHeader icon={MapPin} title="Endereço" description="Seu endereço profissional ou residencial." />
            <div className="space-y-4">
                 <FormField control={form.control} name="cep" render={({ field, fieldState }) => (
                    <FormItem>
                        <FormLabel>CEP</FormLabel>
                         <div className="flex items-center gap-2">
                            <FormControl><Input placeholder="00000-000" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl>
                            <Button type="button" size="icon" onClick={handleCepSearch} disabled={isFetching}>
                                {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                           </Button>
                        </div>
                    </FormItem>
                )} />
                <FormField control={form.control} name="street" render={({ field, fieldState }) => (
                    <FormItem><FormLabel>Rua / Logradouro</FormLabel><FormControl><Input placeholder="Rua das Flores" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="number" render={({ field, fieldState }) => (
                        <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="complement" render={({ field }) => (
                        <FormItem><FormLabel>Complemento (Opcional)</FormLabel><FormControl><Input placeholder="Apto 45" {...field} /></FormControl></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="neighborhood" render={({ field, fieldState }) => (
                    <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="city" render={({ field, fieldState }) => (
                        <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field, fieldState }) => (
                        <FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="SP" {...field} className={cn(fieldState.error && 'border-red-500', fieldState.isDirty && !fieldState.error && 'border-green-500')} /></FormControl></FormItem>
                    )} />
                </div>
            </div>
        </div>
    );
}

const SignatureStep = ({ form, sigCanvas }: { form: any, sigCanvas: React.RefObject<SignatureCanvas> }) => (
    <div>
        <StepHeader icon={PencilLine} title="Assinatura Digital" description="Desenhe sua assinatura. Ela será usada nos contratos." />
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
            )} 
        />
        <Button type="button" variant="outline" size="sm" onClick={() => sigCanvas.current?.clear()} className="mt-2">
            Limpar
        </Button>
    </div>
);
