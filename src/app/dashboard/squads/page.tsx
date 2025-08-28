

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Users2, PlusCircle, Loader2 } from "lucide-react"
import { createSquad, getSquads } from '@/lib/actions/squads'
import { useToast } from '@/hooks/use-toast'
import type { Squad } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AnimatedTooltip } from '@/components/ui/animated-tooltip'
import { Skeleton } from '@/components/ui/skeleton'

const squadSchema = z.object({
  name: z.string().min(3, { message: "O nome do squad deve ter pelo menos 3 caracteres." }),
})

function SquadsPageSkeleton() {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-1/4 mb-2" />
              <div className="flex items-center -space-x-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
}

export default function SquadsPage() {
    const [squads, setSquads] = useState<Squad[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const form = useForm<z.infer<typeof squadSchema>>({
        resolver: zodResolver(squadSchema),
        defaultValues: {
            name: '',
        },
    })

    const fetchSquads = async () => {
        setIsLoading(true)
        const { data, error } = await getSquads()
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar squads', description: error.message })
        } else {
            setSquads(data || [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchSquads()
    }, [])

    const onSubmit = async (values: z.infer<typeof squadSchema>) => {
        setIsSubmitting(true)
        const { error } = await createSquad(values.name)
        setIsSubmitting(false)

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao criar squad', description: error.message })
        } else {
            toast({ title: 'Squad Criado!', description: 'O novo squad foi adicionado com sucesso.' })
            setIsModalOpen(false)
            form.reset()
            fetchSquads() // Re-fetch squads to update the list
        }
    }
    
    return (
        <div className="flex flex-1 flex-col">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Squads</h1>
                <div className="ml-auto flex items-center gap-2">
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-8 gap-1">
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Criar Squad
                                </span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Novo Squad</DialogTitle>
                                <DialogDescription>
                                    Dê um nome para seu novo time de clientes.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Squad</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Clientes de Mídias Sociais" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Salvar Squad
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            
            <div className="mt-4">
                {isLoading ? (
                    <SquadsPageSkeleton />
                ) : squads.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                        <div className="flex flex-col items-center gap-1 text-center">
                            <Users2 className="h-10 w-10 text-muted-foreground" />
                            <h3 className="text-2xl font-bold tracking-tight">
                                Nenhum squad criado
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Crie squads para organizar seus clientes e atribuir secretárias para gerenciá-los.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {squads.map(squad => {
                            const clientsInSquad = squad.squad_clients.map(sc => ({
                                id: sc.clientes.id,
                                name: sc.clientes.full_name || sc.clientes.company_name || 'Cliente',
                                designation: sc.clientes.email || 'E-mail não informado',
                                image: sc.clientes.avatar_url || `https://i.pravatar.cc/150?u=${sc.clientes.id}`,
                            }))

                            return (
                                <Card key={squad.id} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle>{squad.name}</CardTitle>
                                        <CardDescription>Gerenciado por: N/A</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <p className="text-sm font-medium mb-2">Clientes ({clientsInSquad.length})</p>
                                        {clientsInSquad.length > 0 ? (
                                            <div className="flex items-center -space-x-2">
                                                 <AnimatedTooltip items={clientsInSquad} />
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Nenhum cliente no squad.</p>
                                        )}
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" size="sm" className="w-full" disabled>Gerenciar Squad</Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
