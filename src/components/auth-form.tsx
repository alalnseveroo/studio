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
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { signInWithOtp } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

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
    <Card className="w-full max-w-sm animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Bem-vindo ao DASH</CardTitle>
        <CardDescription>
          Digite seu e-mail para entrar ou criar uma conta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleEmailSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="voce@exemplo.com" {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Código
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
