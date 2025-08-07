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
import { Loader2 } from 'lucide-react'
import type { Cliente } from '@/lib/types'

const clientSchema = z.object({
  name: z.string().min(2, { message: 'O nome do cliente deve ter pelo menos 2 caracteres.' }),
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
    },
  })

  const handleFormSubmit = async (values: z.infer<typeof clientSchema>) => {
    setIsLoading(true)
    const { data, error } = await addClient(values.name)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Digite o nome do seu novo cliente para criar um perfil. Você poderá editar os detalhes completos depois.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
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
