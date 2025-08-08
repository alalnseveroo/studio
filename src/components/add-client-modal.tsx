
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { createFullClient } from '@/lib/actions/clients'
import { Loader2, User, Building, Search } from 'lucide-react'
import type { Cliente } from '@/lib/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const fullClientSchema = z.object({
  personType: z.enum(['cpf', 'cnpj']),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  representativeName: z.string().optional(),
  representativeCpf: z.string().optional(),
  fullName: z.string().optional(),
  nationality: z.string().optional(),
  civilStatus: z.string().optional(),
  profession: z.string().optional(),
  cpf: z.string().optional(),
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
}).refine(data => {
    if (data.personType === 'cnpj') {
        return !!data.companyName && !!data.cnpj;
    }
    return true;
}, {
    message: "Para Pessoa Jurídica, o Nome da Empresa e o CNPJ são obrigatórios.",
    path: ["companyName"],
}).refine(data => {
    if (data.personType === 'cpf') {
        return !!data.fullName && !!data.cpf;
    }
    return true;
}, {
    message: "Para Pessoa Física, o Nome Completo e o CPF são obrigatórios.",
    path: ["fullName"],
});


type FullClientFormData = z.infer<typeof fullClientSchema>;

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: (newClient: Cliente) => void
}

export function AddClientModal({ isOpen, onClose, onClientAdded }: AddClientModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const { toast } = useToast()

  const form = useForm<FullClientFormData>({
    resolver: zodResolver(fullClientSchema),
    defaultValues: {
      personType: 'cpf',
      email: '',
      companyName: '',
      cnpj: '',
      representativeName: '',
      representativeCpf: '',
      fullName: '',
      nationality: '',
      civilStatus: '',
      profession: '',
      cpf: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  })

  const personType = form.watch('personType');

  const handleFormSubmit = async (values: FullClientFormData) => {
    setIsLoading(true)
    const { data, error } = await createFullClient(values)
    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Adicionar Cliente',
        description: error.message,
      })
    } else if (data) {
      toast({
        title: 'Cliente Adicionado!',
        description: `O cliente ${data.full_name || data.company_name} foi adicionado.`,
        className: 'bg-green-100 border-green-200 text-green-800'
      })
      onClientAdded(data);
      onClose();
      form.reset();
    }
  }

  const handleCepSearch = async () => {
    const cep = form.getValues('cep')?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
      toast({ variant: 'destructive', title: 'CEP Inválido', description: 'Por favor, digite um CEP válido com 8 dígitos.' });
      return;
    }
    setIsFetchingCep(true);
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
      setIsFetchingCep(false);
    }
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
      form.setValue('email', data.email, { shouldValidate: true });
      if (data.cep) form.setValue('cep', data.cep.replace(/\D/g, ''), { shouldValidate: true });
      toast({ title: 'Sucesso!', description: 'Dados do CNPJ preenchidos.' });
      if(data.cep) handleCepSearch(); // Automatically search for address if CEP is available
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar CNPJ', description: error.message });
    } finally {
      setIsFetchingCnpj(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para cadastrar um novo cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4 max-h-[80vh] overflow-y-auto pr-4">
             <FormField
                control={form.control}
                name="personType"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tipo de Cliente</FormLabel>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                      <FormItem>
                          <RadioGroupItem value="cpf" id="cpf" className="peer sr-only" />
                          <Label htmlFor="cpf" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === 'cpf' && "border-primary")}>
                          <User className="mb-3 h-6 w-6" /> Pessoa Física
                          </Label>
                      </FormItem>
                      <FormItem>
                          <RadioGroupItem value="cnpj" id="cnpj" className="peer sr-only" />
                          <Label htmlFor="cnpj" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === 'cnpj' && "border-primary")}>
                          <Building className="mb-3 h-6 w-6" /> Pessoa Jurídica
                          </Label>
                      </FormItem>
                    </RadioGroup>
                    <FormMessage className="pt-2" />
                </FormItem>
                )}
            />
            
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                <FormLabel>E-mail do Cliente</FormLabel>
                <FormControl><Input type="email" placeholder="email@cliente.com" {...field} /></FormControl>
                <FormDescription>Este e-mail será usado para notificações e assinatura do contrato.</FormDescription>
                <FormMessage />
                </FormItem>
            )} />
            
            {personType === 'cnpj' && (
                <div className="space-y-4 pt-4 border-t">
                    <FormField control={form.control} name="companyName" render={({ field }) => (
                        <FormItem><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Empresa Contratante LTDA" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                        <FormField control={form.control} name="cnpj" render={({ field }) => (
                        <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormControl><Input placeholder="00.000.000/0001-00" {...field} /></FormControl>
                                <Button type="button" size="icon" onClick={handleCnpjSearch} disabled={isFetchingCnpj}>{isFetchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="representativeName" render={({ field }) => (
                        <FormItem><FormLabel>Nome do Representante Legal (Opcional)</FormLabel><FormControl><Input placeholder="Nome do representante" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="representativeCpf" render={({ field }) => (
                        <FormItem><FormLabel>CPF do Representante (Opcional)</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            )}

            {personType === 'cpf' && (
                    <div className="space-y-4 pt-4 border-t">
                        <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome completo do cliente" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="cpf" render={({ field }) => (
                        <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="nationality" render={({ field }) => (
                            <FormItem><FormLabel>Nacionalidade (Opcional)</FormLabel><FormControl><Input placeholder="Brasileira" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="civilStatus" render={({ field }) => (
                            <FormItem><FormLabel>Estado Civil (Opcional)</FormLabel><FormControl><Input placeholder="Solteiro(a)" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                    <FormField control={form.control} name="profession" render={({ field }) => (
                        <FormItem><FormLabel>Profissão (Opcional)</FormLabel><FormControl><Input placeholder="Profissão do cliente" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    </div>
            )}
            
            <div className="space-y-4 pt-4 border-t">
                 <h3 className="font-medium text-lg">Endereço (Opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="cep" render={({ field }) => (
                    <FormItem className="md:col-span-1">
                        <FormLabel>CEP</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl><Input placeholder="00000-000" {...field} /></FormControl>
                            <Button type="button" size="icon" onClick={handleCepSearch} disabled={isFetchingCep}>{isFetchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}/>
                    <FormField control={form.control} name="street" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Rua / Logradouro</FormLabel>
                        <FormControl><Input placeholder="Ex: Rua das Flores" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="number" render={({ field }) => (
                    <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="complement" render={({ field }) => (
                    <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto 45" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="neighborhood" render={({ field }) => (
                    <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="SP" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </div>


            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Cliente
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
