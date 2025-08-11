
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AnimatePresence, motion } from "framer-motion"
import { Check, CreditCard, FileText, ArrowRight, Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Proposta } from "@/lib/types"
import { getProposals } from "@/lib/actions/propostas"
import { useToast } from "@/hooks/use-toast"
import { Card, CardHeader, CardContent } from "@/components/ui/card"


// Step Management
type Step = "selection" | "identification"
type OptionKey = "card1" | "card2" | null

// Zod Schema for Identification step
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


export function AddClientSheet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = React.useState<Step>("selection")
  const [selectedFlow, setSelectedFlow] = React.useState<OptionKey>(null)
  
  const [proposals, setProposals] = React.useState<Proposta[]>([])
  const router = useRouter()

  // State for selection step
  const [docType, setDocType] = React.useState<string | undefined>(undefined)
  const [plano, setPlano] = React.useState<string | undefined>(undefined)

  const canContinueSelection = (selectedFlow === "card1" && !!docType) || (selectedFlow === "card2" && !!plano)

  const { toast } = useToast()

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
  });


  React.useEffect(() => {
    if (isOpen) {
        async function fetchProposalsData() {
            const { data } = await getProposals();
            if (data) setProposals(data);
        }
        fetchProposalsData();
        // Reset state when modal opens
        setStep("selection")
        setSelectedFlow(null);
        setDocType(undefined);
        setPlano(undefined);
        form.reset();
    }
  }, [isOpen, form]);

  const handleSelectionContinue = () => {
    if (selectedFlow === 'card1') {
      router.push('/dashboard/contratos/nova'); // Example, adjust as needed
      onClose();
    } else if (selectedFlow === 'card2') {
      setStep("identification")
    }
  }

  const handleIdentificationSubmit = (values: IdentificationFormData) => {
    console.log(values);
    // Here you would navigate to the next step, e.g.
    // setStep("configuration")
    onClose(); // For now, just close
  }

  const renderContent = () => {
    switch (step) {
      case "identification":
        return <IdentificationStep form={form} onSubmit={handleIdentificationSubmit} toast={toast} />
      case "selection":
      default:
        return (
           <>
            <SheetHeader className="border-b px-6 pb-4 pt-6 bg-white">
              <SheetTitle className="text-lg">Escolha o fluxo</SheetTitle>
              <SheetDescription className="text-sm">
                Selecione uma das opções abaixo para continuar seu processo.
              </SheetDescription>
            </SheetHeader>

            <div className="grid md:grid-cols-2 gap-4 p-6">
              <CardOption
                icon={<IconBadge variant="contract" />}
                title="Criar ou Renovar Contrato"
                description="Para gerar um documento: seja uma proposta para um novo cliente ou um aditivo de renovação para um cliente existente na sua base."
                checked={selectedFlow === "card1"}
                dimmed={selectedFlow === "card2"}
                onClick={() => setSelectedFlow("card1")}
              >
                <div
                  className="mt-3 space-y-2"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                >
                  <Label htmlFor="docType" className="text-xs text-muted-foreground">
                    Tipo de Documento
                  </Label>
                  <Select value={docType} onValueChange={setDocType} disabled={selectedFlow !== 'card1'}>
                    <SelectTrigger id="docType" className="w-full">
                      <SelectValue placeholder="Selecione o tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nova">Nova proposta/contrato</SelectItem>
                      <SelectItem value="renovacao">Renovação de contrato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardOption>

              <CardOption
                icon={<IconBadge variant="billing" />}
                title="Automatizar Cobrança Ativa"
                description="Para clientes que já têm um acordo definido e você quer configurar a cobrança automática imediatamente, sem gerar um novo documento."
                checked={selectedFlow === "card2"}
                dimmed={selectedFlow === "card1"}
                onClick={() => setSelectedFlow("card2")}
              >
                <div
                  className="mt-3 space-y-2"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                >
                  <Label htmlFor="plano" className="text-xs text-muted-foreground">
                    Plano do Cliente
                  </Label>
                  <Select value={plano} onValueChange={setPlano} disabled={selectedFlow !== 'card2'}>
                    <SelectTrigger id="plano" className="w-full">
                      <SelectValue placeholder="Selecione uma Proposta Pré-Definida" />
                    </SelectTrigger>
                    <SelectContent>
                      {proposals.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardOption>
            </div>

            <SheetFooter className="w-full flex flex-row items-center justify-between border-t px-6 py-4 gap-2">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button
                    disabled={!canContinueSelection}
                    onClick={handleSelectionContinue}
                    className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                >
                    Selecionar e Continuar
                </Button>
            </SheetFooter>
        </>
        )
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className={cn("p-0 bg-white sm:max-w-xl", step === 'selection' ? 'sm:max-w-4xl' : 'sm:max-w-2xl')}>
        {renderContent()}
      </SheetContent>
    </Sheet>
  )
}

// ----- Sub-components for the Modal -----

function IdentificationStep({ form, onSubmit, toast }: { form: any, onSubmit: (values: IdentificationFormData) => void, toast: any }) {
    const [isFetchingCnpj, setIsFetchingCnpj] = React.useState(false);
    const watchAddCompany = form.watch('addCompanyData');
    
    const formatCpf = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14);
    const formatCnpj = (value: string) => value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d)/, "$1-$2").substring(0, 18);
    const formatPhone = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);

    const handleCnpjSearch = async () => {
        const cnpj = form.getValues('cnpj')?.replace(/\D/g, '');
        if (!cnpj || cnpj.length !== 14) {
            toast({ variant: 'destructive', title: 'CNPJ Inválido' });
            return;
        }
        setIsFetchingCnpj(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Não foi possível buscar os dados do CNPJ.');
            form.setValue('companyName', data.razao_social, { shouldValidate: true });
            form.setValue('tradeName', data.nome_fantasia || '', { shouldValidate: true });
            toast({ title: 'Sucesso!', description: 'Dados da empresa preenchidos.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao buscar CNPJ', description: error.message });
        } finally {
            setIsFetchingCnpj(false);
        }
    };
    
    return (
        <FormProvider {...form}>
            <SheetHeader className="text-left border-b p-6">
                <SheetTitle>Primeiro, os dados da pessoa de contato.</SheetTitle>
                <SheetDescription>Esta pessoa será a responsável principal pela comunicação e pagamentos.</SheetDescription>
            </SheetHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="p-6 space-y-6">
                    <Card className="border-none shadow-none">
                        <CardHeader className="p-0 mb-4">
                            <CardContent className="font-semibold p-0">Dados da Pessoa de Contato</CardContent>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
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

                    <Card className="border-none shadow-none">
                        <CardContent className="p-0">
                            <FormField control={form.control} name="addCompanyData" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <FormLabel className="font-normal cursor-pointer pr-4" onClick={() => field.onChange(!field.value)}>Adicionar dados de Pessoa Jurídica (PJ)</FormLabel>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}/>
                        </CardContent>
                        <AnimatePresence initial={false}>
                            {watchAddCompany && (
                                <motion.div
                                    key="content"
                                    initial="collapsed" animate="open" exit="collapsed"
                                    variants={{ open: { opacity: 1, height: "auto" }, collapsed: { opacity: 0, height: 0 } }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <CardHeader className="px-0 pt-4 pb-2">
                                        <CardContent className="font-semibold p-0">Dados da Empresa</CardContent>
                                        <FormDescription>Busque pelo CNPJ para preencher (recomendado)</FormDescription>
                                    </CardHeader>
                                    <CardContent className="p-0 space-y-4">
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
                </div>
                 <SheetFooter className="border-t p-6 flex justify-end">
                    <Button type="submit">
                        Ir para Configuração <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </SheetFooter>
            </form>
        </FormProvider>
    )
}


function CardOption({ icon, title, description, checked, dimmed, onClick, children }: { icon: React.ReactNode, title: string, description: string, checked: boolean, dimmed?: boolean, onClick?: () => void, children?: React.ReactNode }) {
  return (
    <div
      role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.() } }}
      aria-pressed={checked}
      className={cn(
        "group relative w-full rounded-2xl border bg-white p-5 md:p-6 text-left shadow-sm transition-all h-full",
        checked ? "border-emerald-500" : "border-gray-200",
        dimmed ? "opacity-75" : "hover:-translate-y-0.5 hover:shadow-md",
        "outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-emerald-500",
      )}
    >
      <div className="pointer-events-none absolute right-4 top-4">
        <AnimatedCheckbox checked={checked} ariaLabel={`Selecionar ${title}`} />
      </div>
      <div className="flex items-start gap-4">
        <div className="shrink-0 pt-0.5">{icon}</div>
        <div className="min-w-0 w-full">
          <h3 className="text-base font-semibold leading-snug">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

function IconBadge({ variant }: { variant: "contract" | "billing" }) {
  const Icon = variant === "contract" ? FileText : CreditCard
  return (
    <div aria-hidden="true" className={cn("flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm", "bg-gradient-to-br from-emerald-50 to-white border-emerald-100")}>
      <Icon className="h-5 w-5 text-emerald-600" />
    </div>
  )
}

function AnimatedCheckbox({ checked, ariaLabel }: { checked: boolean; ariaLabel?: string }) {
  return (
    <div
      role="checkbox" aria-checked={checked} aria-label={ariaLabel}
      className={cn("relative inline-flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white", checked ? "border-emerald-600" : "border-gray-300", "transition-colors")}
    >
      <AnimatePresence initial={false}>
        {checked && (
          <motion.span key="fill" className="absolute inset-0 m-[2px] rounded-full bg-emerald-600"
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {checked && (
          <motion.span key="check" className="relative z-10 text-white"
            initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut", delay: 0.06 }}
          >
            <Check className="h-3.5 w-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

    