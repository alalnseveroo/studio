
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
  FormItem,
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
    <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500">
       <Form {...form}>
        <form onSubmit={form.handleSubmit(handleEmailSubmit)}>
            <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center rounded-md">
                   <Image 
                     src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Office%20Working%201.png" 
                     alt="Assistei Logo" 
                     width={150} 
                     height={150}
                     className="size-[150px]"
                    />
                </div>
                <h1 className="text-xl font-bold font-headline">Bem-vindo(a) à Assistei</h1>
                <p className="text-sm text-muted-foreground">Organizando o trabalho de profissionais incríveis</p>
            </div>
            <div className="flex flex-col gap-4">
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
                                    className="pl-9"
                                />
                           </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Código
                </Button>
            </div>
            </div>
        </form>
       </Form>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        Ao continuar, você concorda com nossos <a href="#">Termos de Serviço</a>{" "}
        e <a href="#">Política de Privacidade</a>.
      </div>
    </div>
  )
}
