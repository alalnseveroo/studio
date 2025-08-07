
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { addClient } from '@/lib/actions/clients'
import { Loader2, User, Building } from 'lucide-react'
import type { Cliente } from '@/lib/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const clientSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  personType: z.enum(['cpf', 'cnpj'], { required_error: 'Você deve selecionar o tipo de pessoa.' }),
})

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: (newClient: Cliente) => void
}

export function AddClientModal({ isOpen, onClose, onClientAdded }: AddClientModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      personType: undefined,
    },
  })

  const handleFormSubmit = async (values: z.infer<typeof clientSchema>) => {
    setIsLoading(true)
    const { data, error } = await addClient(values.name, values.personType)
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
        description: `O cliente ${values.name} foi adicionado com sucesso.`,
      })
      onClientAdded(data);
      router.push(`/dashboard/clientes/${data.id}`);
      onClose();
      form.reset();
    }
  }
  
  const personType = form.watch('personType');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Primeiro, selecione o tipo de cliente e digite o nome completo ou a razão social.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
             <FormField
                control={form.control}
                name="personType"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tipo de Contratação</FormLabel>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                    <FormItem>
                        <RadioGroupItem value="cpf" id="cpf" className="peer sr-only" />
                        <Label htmlFor="cpf" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === 'cpf' && "border-green-500 bg-green-500/10")}>
                        <User className="mb-3 h-6 w-6" /> Pessoa Física
                        </Label>
                    </FormItem>
                    <FormItem>
                        <RadioGroupItem value="cnpj" id="cnpj" className="peer sr-only" />
                        <Label htmlFor="cnpj" className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === 'cnpj' && "border-green-500 bg-green-500/10")}>
                        <Building className="mb-3 h-6 w-6" /> Pessoa Jurídica
                        </Label>
                    </FormItem>
                    </RadioGroup>
                    <FormMessage className="pt-2" />
                </FormItem>
                )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {personType === 'cpf' ? 'Nome Completo do Cliente' : personType === 'cnpj' ? 'Razão Social da Empresa' : 'Nome do Cliente / Empresa'}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={personType === 'cpf' ? 'Ex: João da Silva' : 'Ex: Empresa Exemplo LTDA'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar e Continuar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
