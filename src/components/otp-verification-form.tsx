
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import { verifyOtp } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const otpSchema = z.object({
  otp: z.string().min(6, { message: 'O código deve ter 6 dígitos.' }),
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
                <h1 className="text-xl font-bold">Erro</h1>
                <p className="text-sm text-muted-foreground">E-mail não fornecido. Por favor, retorne à página de login.</p>
                <Button onClick={() => router.push('/')} className="mt-4 w-full">Ir para o Login</Button>
            </div>
        </div>
    )
  }
  
  return (
    <div className="w-full max-w-sm animate-in fade-in-50 duration-500">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleOtpSubmit)}>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-start gap-2">
                        <h1 className="text-2xl font-bold font-headline md:text-3xl">Verifique seu Código</h1>
                        <p className="text-sm text-muted-foreground">
                            Digite o código de 6 dígitos enviado para <strong>{email}</strong>
                        </p>
                    </div>
                    <div className="space-y-4">
                        <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <InputOTP maxLength={6} {...field}>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                    </InputOTP>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="flex justify-start">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verificar e Entrar
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    </div>
  )
}
