
'use client'

import { useState, useEffect } from 'react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { upsertFinancialGoal } from '@/lib/actions/goals'
import { Loader2 } from 'lucide-react'
import type { FinancialGoal } from '@/lib/types'

const goalSchema = z.object({
  goal_amount: z.coerce.number().min(0, 'A meta deve ser um valor positivo.'),
})

interface SetGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onGoalSet: () => void
  currentGoal?: FinancialGoal | null
}

export function SetGoalModal({ isOpen, onClose, onGoalSet, currentGoal }: SetGoalModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goal_amount: currentGoal?.goal_amount || 0,
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.setValue('goal_amount', currentGoal?.goal_amount || 0)
    }
  }, [isOpen, currentGoal, form])

  const onSubmit = async (values: z.infer<typeof goalSchema>) => {
    setIsLoading(true)
    const { error } = await upsertFinancialGoal(values.goal_amount)
    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar Meta',
        description: error.message,
      })
    } else {
      toast({
        title: 'Meta Salva!',
        description: 'Sua meta financeira foi atualizada.',
      })
      onGoalSet()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Definir Meta de Faturamento</DialogTitle>
          <DialogDescription>
            Qual valor você deseja alcançar este mês? Esta meta ajudará a visualizar seu progresso.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="goal_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Meta (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Meta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
