
"use client"

import * as React from "react"
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
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

import type { Cliente } from "@/lib/types"
import { createFullClient } from "@/lib/actions/clients"
import { useToast } from "@/hooks/use-toast"

const clientSchema = z.object({
  personType: z.enum(['cpf', 'cnpj']),
  // Common fields
  email: z.string().email({ message: "E-mail inválido."}),
  address: z.string().min(10, { message: "O endereço completo é obrigatório."}),
  // PF Fields
  fullName: z.string().optional(),
  cpf: z.string().optional(),
  // PJ Fields
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  representativeName: z.string().optional(),
  representativeCpf: z.string().optional(),
  
}).refine(data => {
    if (data.personType === 'cnpj') {
        return !!data.companyName && !!data.cnpj && !!data.representativeName && !!data.representativeCpf;
    }
    return true;
}, {
    message: "Nome da empresa, CNPJ e dados do representante são obrigatórios.",
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

interface AddClientSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: Cliente) => void;
}

export function AddClientSheet({ isOpen, onClose, onSuccess }: AddClientSheetProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { 
        personType: 'cpf', 
        fullName: '', 
        cpf: '', 
        companyName: '', 
        cnpj: '', 
        email: '', 
        address: '',
        representativeName: '',
        representativeCpf: '' 
    },
    mode: 'onBlur'
  });

  const personType = form.watch('personType');

  React.useEffect(() => {
    if (isOpen) {
        form.reset();
    }
  }, [isOpen, form]);

  const handleFormSubmit = async (values: ClientFormData) => {
    setIsLoading(true);
    const { data, error } = await createFullClient(values);
    setIsLoading(false);

    if (error) {
        toast({ variant: 'destructive', title: 'Erro ao Criar Cliente', description: error.message });
    } else if (data) {
        toast({ title: 'Cliente Adicionado!', description: 'O novo cliente foi salvo com sucesso.'})
        onSuccess(data);
    }
  };
  
  const handleClose = () => {
    form.reset();
    onClose();
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
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
                    
                     <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>E-mail de Contato Principal</FormLabel><FormControl><Input type="email" placeholder="contato@empresa.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    
                    {personType === 'cpf' ? (
                        <div className="space-y-4">
                             <FormField control={form.control} name="fullName" render={({ field }) => (
                                <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome do cliente" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="cpf" render={({ field }) => (
                                <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    ) : (
                         <div className="space-y-4">
                            <FormField control={form.control} name="companyName" render={({ field }) => (
                                <FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input placeholder="Empresa Exemplo LTDA" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="cnpj" render={({ field }) => (
                                <FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0001-00" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="representativeName" render={({ field }) => (
                                <FormItem><FormLabel>Nome do Representante Legal</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="representativeCpf" render={({ field }) => (
                                <FormItem><FormLabel>CPF do Representante</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    )}
                     <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>Endereço Completo</FormLabel><FormControl><Input placeholder="Rua, Número, Bairro, CEP, Cidade, Estado" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <SheetFooter className="border-t p-6 flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar e Avançar'}
                    </Button>
                </SheetFooter>
            </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
    </>
  )
}
