'use client'

import { useState } from 'react'
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
import { verifyOtp } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const otpSchema = z.object({
  otp: z.string().min(6, { message: 'O OTP deve ter 6 dígitos.' }).max(6, { message: 'O OTP deve ter 6 dígitos.' }),
})

interface OtpVerificationFormProps {
  email: string
}

export function OtpVerificationForm({ email }: OtpVerificationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  })

  const handleOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    if (!email) {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'E-mail não informado. Por favor, volte e tente novamente.',
        })
        return;
    }
    setIsLoading(true)
    const { error } = await verifyOtp(email, values.otp)
    
    if (error) {
        setIsLoading(false)
        toast({
            variant: 'destructive',
            title: 'Erro de Verificação',
            description: error.message,
        })
        form.reset();
    } else {
        router.push('/dashboard');
    }
  }

  if (!email) {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Erro</CardTitle>
                <CardDescription>E-mail não fornecido. Por favor, retorne à página de login.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => router.push('/')} className="w-full">Ir para o Login</Button>
            </CardContent>
        </Card>
    )
  }
  
  return (
    <Card className="w-full max-w-sm animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Verifique seu Código</CardTitle>
        <CardDescription>Digite o código de 6 dígitos enviado para <strong>{email}</strong></CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleOtpSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha de Uso Único</FormLabel>
                  <FormControl>
                    <Input placeholder="123456" {...field} inputMode="numeric" autoComplete="one-time-code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar e Entrar
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
