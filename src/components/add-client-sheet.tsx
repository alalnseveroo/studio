
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Check, CreditCard, FileText, ArrowRight, Loader2, Search, User, Settings, ArrowLeft, Briefcase, UserCircle } from "lucide-react"

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
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { cn } from "@/lib/utils"
import type { Cliente } from "@/lib/types"
import { createFullClient } from "@/lib/actions/clients"
import { useToast } from "@/hooks/use-toast"

const clientSchema = z.object({
  personType: z.enum(['cpf', 'cnpj']),
  // PJ Fields
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  // PF Fields
  fullName: z.string().optional(),
  cpf: z.string().optional(),
  // Common fields
  email: z.string().email({ message: "E-mail inválido."}),
  phone: z.string().optional(),
}).refine(data => {
    if (data.personType === 'cnpj') {
        return !!data.companyName && !!data.cnpj;
    }
    return true;
}, {
    message: "Nome da empresa e CNPJ são obrigatórios.",
    path: ["companyName"],
}).refine(data => {
    if (data.personType === 'cpf') {
        return !!data.fullName && !!data.cpf;
    }
    return true;
}, {
    message: "Nome completo e CPF são obrigatórios.",
    path: ["fullName"],
});


type ClientFormData = z.infer<typeof clientSchema>;

export function AddClientSheet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [newlyCreatedClient, setNewlyCreatedClient] = React.useState<Cliente | null>(null);
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { personType: 'cpf', fullName: '', cpf: '', companyName: '', cnpj: '', email: '', phone: '' },
    mode: 'onBlur'
  });

  const personType = form.watch('personType');

  React.useEffect(() => {
    if (isOpen) {
        form.reset();
        setShowSuccessModal(false);
        setNewlyCreatedClient(null);
    }
  }, [isOpen, form]);

  const handleFormSubmit = async (values: ClientFormData) => {
    setIsLoading(true);
    const { data, error } = await createFullClient(values);
    setIsLoading(false);

    if (error) {
        toast({ variant: 'destructive', title: 'Erro ao Criar Cliente', description: error.message });
    } else if (data) {
        setNewlyCreatedClient(data);
        setShowSuccessModal(true);
        // We don't close the main sheet here, it will be closed by the success modal actions
    }
  };
  
  const handleSuccessAction = (action: 'contract' | 'billing') => {
    setShowSuccessModal(false);
    onClose();
    if(action === 'contract') {
        router.push('/dashboard/contratos'); // User can open the modal from there
    } else {
        router.push(`/dashboard/clientes/${newlyCreatedClient?.id}`);
    }
  }


  return (
    <>
    <Sheet open={isOpen && !showSuccessModal} onOpenChange={onClose}>
      <SheetContent className="p-0 bg-white sm:max-w-xl">
        <FormProvider {...form}>
            <SheetHeader className="text-left border-b p-6">
                <SheetTitle>Adicionar Novo Cliente</SheetTitle>
                <SheetDescription>Preencha os dados do cliente. Você poderá configurar contratos ou cobranças a seguir.</SheetDescription>
            </SheetHeader>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col h-[calc(100%-120px)]">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <FormField
                        control={form.control}
                        name="personType"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <FormLabel className="font-normal pr-4" >
                                {field.value === 'cpf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                            </FormLabel>
                            <FormControl>
                                <Switch
                                    checked={field.value === 'cnpj'}
                                    onCheckedChange={(checked) => field.onChange(checked ? 'cnpj' : 'cpf')}
                                />
                            </FormControl>
                          </FormItem>
                        )}
                    />
                    
                    {personType === 'cpf' ? (
                        <div className="space-y-4">
                             <FormField control={form.control} name="fullName" render={({ field }) => (
                                <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome do cliente" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="cpf" render={({ field }) => (
                                <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    ) : (
                         <div className="space-y-4">
                            <FormField control={form.control} name="companyName" render={({ field }) => (
                                <FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input placeholder="Empresa Exemplo LTDA" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="cnpj" render={({ field }) => (
                                <FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0001-00" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    )}
                    
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>E-mail de Contato Principal</FormLabel><FormControl><Input type="email" placeholder="contato@empresa.com" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Telefone / WhatsApp</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )}/>

                </div>
                 <SheetFooter className="border-t p-6 flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Cliente'}
                    </Button>
                </SheetFooter>
            </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
    
     <AlertDialog open={showSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <Check className="h-6 w-6 text-green-500 bg-green-100 rounded-full p-1" />
                Cliente criado com sucesso!
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4">
              O que você gostaria de fazer agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 mt-2">
             <button
                onClick={() => handleSuccessAction('contract')}
                className="flex items-start gap-4 rounded-lg border p-4 text-left text-sm transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
                <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                    <p className="font-semibold">Criar Contrato</p>
                    <p className="text-muted-foreground">Elabore um contrato de prestação de serviços para formalizar a parceria com este cliente.</p>
                </div>
             </button>
             <button
                onClick={() => handleSuccessAction('billing')}
                className="flex items-start gap-4 rounded-lg border p-4 text-left text-sm transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
                 <CreditCard className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                 <div className="flex-1">
                    <p className="font-semibold">Ir para o perfil do cliente</p>
                    <p className="text-muted-foreground">Acesse o perfil para configurar uma cobrança, preencher dados e mais.</p>
                </div>
            </button>
          </div>
        </AlertDialogContent>
    </AlertDialog>

    </>
  )
}

    