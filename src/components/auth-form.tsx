
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from '@/components/ui/form'
import { signInWithOtp } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail } from 'lucide-react'
import Image from 'next/image'

const emailSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um endereço de e-mail válido.' }),
})

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  })

  const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true)
    const { error } = await signInWithOtp(values.email)
    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: error.message,
      })
    } else {
      toast({
        title: 'Verifique seu e-mail',
        description: `Enviamos um código de 6 dígitos para ${values.email}.`,
      })
      router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`)
    }
  }

  return (
    <div className="w-full max-w-sm animate-in fade-in-50 duration-500">
       <Form {...form}>
        <form onSubmit={form.handleSubmit(handleEmailSubmit)} className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold font-headline md:text-3xl">Acesse sua conta</h1>
                <p className="text-muted-foreground">
                    Organizando o trabalho de profissionais incríveis.
                </p>
            </div>
            
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <FormControl>
                                <Input 
                                    placeholder="Coloque seu e-mail" 
                                    {...field} 
                                    type="email" 
                                    className="pl-9 h-11"
                                />
                           </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Código
                </Button>
            </div>
        </form>
       </Form>
        <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
                Termos de Serviço
            </a>{' '}
            e{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
                Política de Privacidade
            </a>
            .
        </p>
    </div>
  )
}
