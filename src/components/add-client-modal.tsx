

"use client"

import * as React from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createFullClient } from "@/lib/actions/clients"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Check, ChevronsUpDown, CheckCircle, XCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import type { Proposta, Cliente } from '@/lib/types'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command'
import { cn } from '@/lib/utils'

const clientSchema = z.object({
  personType: z.enum(['cpf', 'cnpj'], { required_error: "Selecione o tipo de pessoa."}),
  sex: z.enum(['male', 'female'], { required_error: 'Selecione o sexo.'}),
  email: z.string().email({ message: "E-mail inválido."}),
  
  // Universal name field
  fullName: z.string().optional(), // For PF
  companyName: z.string().optional(), // For PJ

  nationality: z.string().min(2, "A nacionalidade é obrigatória."),

  // PF
  cpf: z.string().optional(),
  
  // PJ
  cnpj: z.string().optional(),
  representativeName: z.string().optional(),
  representativeCpf: z.string().optional(),

  // Endereço
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  
}).refine(data => {
    if (data.personType === 'cpf') {
        return !!data.fullName && data.fullName.length >= 3 && !!data.cpf;
    }
    return true;
}, {
    message: "Nome completo e CPF são obrigatórios para Pessoa Física.",
    path: ["fullName"], 
}).refine(data => {
    if (data.personType === 'cnpj') {
        return !!data.companyName && data.companyName.length >= 3 && !!data.cnpj;
    }
    return true;
}, {
    message: "Razão Social e CNPJ são obrigatórios para Pessoa Jurídica.",
    path: ["companyName"],
});


type ClientFormData = z.infer<typeof clientSchema>;

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: Cliente) => void;
  proposals: Proposta[];
}

const nationalities = [
  { value: 'Brasileira', label: 'Brasileira' },
  { value: 'Portuguesa', label: 'Portuguesa' },
  { value: 'Americana', label: 'Americana' },
  { value: 'Canadense', label: 'Canadense' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Espanhola', label: 'Espanhola' },
  { value: 'Italiana', label: 'Italiana' },
  { value: 'Outra', label: 'Outra' },
];

function Combobox({ field, options, placeholder }: { field: any, options: {value: string, label: string}[], placeholder: string }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9"
        >
          {field.value
            ? options.find((option) => option.value.toLowerCase() === field.value.toLowerCase())?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Procure uma nacionalidade..." />
          <CommandEmpty>Nenhuma nacionalidade encontrada.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={(currentValue) => {
                  field.onChange(currentValue === field.value ? "" : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    field.value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ValidatedInput({ field, fieldState, placeholder }: { field: any, fieldState: any, placeholder: string }) {
    return (
        <div className="relative w-full">
            <FormControl>
                <Input
                    placeholder={placeholder}
                    {...field}
                    className={cn(
                        'h-9 pr-10',
                        fieldState.error && 'border-red-500 focus-visible:ring-red-500',
                        fieldState.isDirty && !fieldState.error && 'border-green-500'
                    )}
                />
            </FormControl>
            {fieldState.isDirty && !fieldState.error && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
            )}
            {fieldState.error && (
                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <XCircle className="h-4 w-4 text-red-500" />
                </div>
            )}
        </div>
    );
}

export function AddClientModal({ isOpen, onClose, onSuccess, proposals }: AddClientModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      personType: undefined,
      sex: undefined,
      email: '',
      fullName: '',
      companyName: '',
      nationality: 'Brasileira',
      cpf: '',
      cnpj: '',
      representativeName: '',
      representativeCpf: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
    mode: 'onBlur'
  });
  
  const personType = form.watch('personType');

  React.useEffect(() => {
    if (isOpen) {
        form.reset({ 
            personType: undefined,
            sex: undefined,
            email: '',
            fullName: '',
            companyName: '',
            nationality: 'Brasileira',
            cpf: '',
            cnpj: '',
            representativeName: '',
            representativeCpf: '',
            cep: '',
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
        });
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

  const handleCepSearch = async () => {
    const cep = form.getValues('cep')?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
      toast({ variant: 'destructive', title: 'CEP Inválido', description: 'Por favor, digite um CEP válido com 8 dígitos.' });
      return;
    }
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };
    
  const handleCnpjSearch = async () => {
    const cnpj = form.getValues('cnpj')?.replace(/\D/g, '');
    if (!cnpj || cnpj.length !== 14) {
      toast({ variant: 'destructive', title: 'CNPJ Inválido', description: 'Por favor, digite um CNPJ válido.' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) throw new Error('Não foi possível buscar os dados do CNPJ.');
      const data = await response.json();
      form.setValue('companyName', data.razao_social, { shouldValidate: true });
      if (data.cep) form.setValue('cep', data.cep.replace(/\D/g, ''), { shouldValidate: true });
      if(data.logradouro) form.setValue('street', data.logradouro, { shouldValidate: true });
      if(data.numero) form.setValue('number', data.numero, { shouldValidate: true });
      if(data.bairro) form.setValue('neighborhood', data.bairro, { shouldValidate: true });
      if(data.municipio) form.setValue('city', data.municipio, { shouldValidate: true });
      if(data.uf) form.setValue('state', data.uf, { shouldValidate: true });
      toast({ title: 'Sucesso!', description: 'Dados do cliente preenchidos.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar CNPJ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-normal">Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>Preencha os dados abaixo para cadastrar um novo cliente. A cobrança será configurada depois.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)}>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    
                     <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="contato@cliente.com" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="sex" render={({ field }) => (
                            <FormItem><FormLabel>Sexo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="female">Feminino</SelectItem>
                                        <SelectItem value="male">Masculino</SelectItem>
                                    </SelectContent>
                                </Select>
                            <FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="nationality" render={({ field }) => (
                            <FormItem><FormLabel>Nacionalidade</FormLabel>
                                <Combobox field={field} options={nationalities} placeholder="Selecione..."/>
                            <FormMessage /></FormItem>
                        )} />
                    </div>

                    <FormField control={form.control} name="personType" render={({ field }) => (
                        <FormItem className="space-y-4 pt-4">
                        <FormLabel>Tipo de Pessoa</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-4">
                                <FormItem>
                                <FormControl>
                                    <RadioGroupItem value="cpf" id="cpf" className="sr-only peer" />
                                </FormControl>
                                <FormLabel htmlFor="cpf" className={cn(
                                    "flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all",
                                    field.value === 'cpf' ? "border-green-500 shadow-sm" : "border-border"
                                )}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-base">Pessoa Física</span>
                                        <div className={cn( "w-5 h-5 rounded-full border-2 flex items-center justify-center", field.value === 'cpf' ? "bg-green-500 border-green-500" : "border-muted-foreground" )}>
                                            {field.value === 'cpf' && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                    {personType === 'cpf' && (
                                        <div className="space-y-4 pt-4 border-t">
                                             <FormField control={form.control} name="fullName" render={({ field, fieldState }) => (
                                                <FormItem><FormLabel>Nome Completo</FormLabel><ValidatedInput field={field} fieldState={fieldState} placeholder="Ex: Maria da Silva" /><FormMessage /></FormItem>
                                             )}/>
                                             <FormField control={form.control} name="cpf" render={({ field, fieldState }) => (
                                                <FormItem><FormLabel>CPF</FormLabel><ValidatedInput field={field} fieldState={fieldState} placeholder="000.000.000-00" /><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="cep" render={({ field, fieldState }) => (
                                                <FormItem><FormLabel>CEP</FormLabel>
                                                    <div className="flex items-center gap-2">
                                                        <ValidatedInput field={field} fieldState={fieldState} placeholder="00000-000" />
                                                        <Button type="button" size="icon" className="h-9 w-9 shrink-0" onClick={handleCepSearch} disabled={isLoading}><Search className="h-4 w-4" /></Button>
                                                    </div>
                                                <FormMessage /></FormItem>
                                            )}/>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <FormField control={form.control} name="street" render={({ field }) => (
                                                    <FormItem className="md:col-span-2"><FormLabel>Rua</FormLabel><FormControl><Input placeholder="Rua das Flores" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                                                )}/>
                                                 <FormField control={form.control} name="number" render={({ field }) => (
                                                    <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                                                )}/>
                                            </div>
                                            <FormField control={form.control} name="complement" render={({ field }) => (
                                                <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto 101" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                                            )}/>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                 <FormField control={form.control} name="neighborhood" render={({ field }) => (
                                                    <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                                                )}/>
                                                <FormField control={form.control} name="city" render={({ field }) => (
                                                    <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                                                )}/>
                                                <FormField control={form.control} name="state" render={({ field }) => (
                                                    <FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                                                )}/>
                                            </div>
                                        </div>
                                    )}
                                </FormLabel>
                                </FormItem>

                                 <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="cnpj" id="cnpj" className="sr-only peer" />
                                    </FormControl>
                                    <FormLabel htmlFor="cnpj" className={cn(
                                      "flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all", 
                                      field.value === 'cnpj' ? "border-green-500 shadow-sm" : "border-border"
                                    )}>
                                         <div className="flex items-center justify-between">
                                            <span className="font-semibold text-base">Pessoa Jurídica</span>
                                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", field.value === 'cnpj' ? "bg-green-500 border-green-500" : "border-muted-foreground")}>
                                              {field.value === 'cnpj' && <Check className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                         {personType === 'cnpj' && (
                                            <div className="space-y-4 pt-4 border-t">
                                                 <FormField control={form.control} name="cnpj" render={({ field, fieldState }) => (
                                                    <FormItem><FormLabel>CNPJ</FormLabel>
                                                        <div className="flex items-center gap-2">
                                                            <ValidatedInput field={field} fieldState={fieldState} placeholder="00.000.000/0001-00" />
                                                            <Button type="button" size="icon" className="h-9 w-9 shrink-0" onClick={handleCnpjSearch} disabled={isLoading}><Search className="h-4 w-4" /></Button>
                                                        </div>
                                                    <FormMessage /></FormItem>
                                                )}/>
                                                <FormField control={form.control} name="companyName" render={({ field, fieldState }) => (
                                                    <FormItem><FormLabel>Razão Social</FormLabel><ValidatedInput field={field} fieldState={fieldState} placeholder="Empresa Modelo Ltda." /><FormMessage /></FormItem>
                                                )}/>
                                                <FormField control={form.control} name="representativeName" render={({ field, fieldState }) => (
                                                    <FormItem><FormLabel>Representante Legal</FormLabel><ValidatedInput field={field} fieldState={fieldState} placeholder="Nome do responsável" /><FormMessage /></FormItem>
                                                )}/>
                                                <FormField control={form.control} name="representativeCpf" render={({ field, fieldState }) => (
                                                    <FormItem><FormLabel>CPF do Representante</FormLabel><ValidatedInput field={field} fieldState={fieldState} placeholder="000.000.000-00" /><FormMessage /></FormItem>
                                                )}/>
                                                
                                                <FormField control={form.control} name="cep" render={({ field, fieldState }) => (
                                                    <FormItem><FormLabel>CEP</FormLabel>
                                                        <div className="flex items-center gap-2">
                                                            <ValidatedInput field={field} fieldState={fieldState} placeholder="00000-000" />
                                                            <Button type="button" size="icon" className="h-9 w-9 shrink-0" onClick={handleCepSearch} disabled={isLoading}><Search className="h-4 w-4" /></Button>
                                                        </div>
                                                    <FormMessage /></FormItem>
                                                )}/>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <FormField control={form.control} name="street" render={({ field }) => (
                                                        <FormItem className="md:col-span-2"><FormLabel>Rua</FormLabel><FormControl><Input placeholder="Rua das Flores" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                                                    )}/>
                                                    <FormField control={form.control} name="number" render={({ field }) => (
                                                        <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                                                    )}/>
                                                </div>
                                                <FormField control={form.control} name="neighborhood" render={({ field }) => (
                                                    <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                                                )}/>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField control={form.control} name="city" render={({ field }) => (
                                                        <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                                                    )}/>
                                                    <FormField control={form.control} name="state" render={({ field }) => (
                                                        <FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input {...field} className="h-9"/></FormControl><FormMessage /></FormItem>
                                                    )}/>
                                                </div>
                                            </div>
                                         )}
                                    </FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>

                 <DialogFooter className="p-6 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Cliente'}
                    </Button>
                </DialogFooter>
            </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
