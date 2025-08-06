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
import { signInWithOtp, verifyOtp } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
})

const otpSchema = z.object({
  otp: z.string().min(6, { message: 'OTP must be 6 digits.' }).max(6, { message: 'OTP must be 6 digits.' }),
})

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  })

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  })

  const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true)
    const { error } = await signInWithOtp(values.email)
    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      })
    } else {
      toast({
        title: 'Check your email',
        description: `We've sent a 6-digit code to ${values.email}.`,
      })
      setEmail(values.email)
      setIsOtpSent(true)
    }
  }

  const handleOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    setIsLoading(true)
    const { error } = await verifyOtp(email, values.otp)
    
    if (error) {
        setIsLoading(false)
        toast({
            variant: 'destructive',
            title: 'Verification Error',
            description: error.message,
        })
        otpForm.reset();
    }
  }
  
  if (isOtpSent) {
    return (
      <Card className="w-full max-w-sm animate-in fade-in-50 duration-500">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Verify Your Code</CardTitle>
          <CardDescription>Enter the 6-digit code sent to <strong>{email}</strong></CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>One-Time Password</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} inputMode="numeric" autoComplete="one-time-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Welcome to DASH</CardTitle>
        <CardDescription>
          Enter your email to sign in or create an account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Code
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
