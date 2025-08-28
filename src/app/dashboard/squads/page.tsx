

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
import { Users2, PlusCircle, Loader2, Pencil } from "lucide-react"
import { createSquad, getSquads, updateSquad, getClientsNotInSquads } from '@/lib/actions/squads'
import { useToast } from '@/hooks/use-toast'
import type { Squad, Cliente } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { AnimatedTooltip } from '@/components/ui/animated-tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'


const squadSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: "O nome do squad deve ter pelo menos 3 caracteres." }),
  clientIds: z.array(z.string()).optional(),
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

function MultiSelectClients({
  allClients,
  selectedClients,
  onSelectionChange
} : {
  allClients: Cliente[],
  selectedClients: Cliente[],
  onSelectionChange: (clients: Cliente[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const handleSelect = (client: Cliente) => {
    onSelectionChange([...selectedClients, client])
    setInputValue("")
  }

  const handleRemove = (client: Cliente) => {
    onSelectionChange(selectedClients.filter(c => c.id !== client.id))
  }

  const filteredClients = allClients.filter(
    client => !selectedClients.some(selected => selected.id === client.id)
  )

  return (
      <Command className="overflow-visible bg-transparent">
        <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <div className="flex flex-wrap gap-1">
                {selectedClients.map(client => (
                    <Badge key={client.id} variant="secondary">
                        {client.full_name || client.company_name}
                        <button
                            type="button"
                            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onClick={() => handleRemove(client)}
                        >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                    </Badge>
                ))}
                 <CommandInput
                    placeholder="Selecione os clientes..."
                    value={inputValue}
                    onValueChange={setInputValue}
                    onBlur={() => setOpen(false)}
                    onFocus={() => setOpen(true)}
                    className="ml-2 flex-1 bg-transparent p-0 outline-none placeholder:text-muted-foreground"
                />
            </div>
        </div>
         <div className="relative mt-2">
            {open && filteredClients.length > 0 && (
                 <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                    <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                            {filteredClients.map(client => (
                                <CommandItem
                                    key={client.id}
                                    onSelect={() => handleSelect(client)}
                                >
                                    {client.full_name || client.company_name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </div>
            )}
        </div>
      </Command>
  )
}


function SquadModal({
    isOpen,
    onClose,
    onSuccess,
    squad,
    unassignedClients,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    squad?: Squad | null;
    unassignedClients: Cliente[];
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof squadSchema>>({
        resolver: zodResolver(squadSchema),
        defaultValues: { id: '', name: '', clientIds: [] },
    });
    
    const availableClients = squad ? [...unassignedClients, ...squad.squad_clients.map(sc => sc.clientes)] : unassignedClients;
    
    const [selectedClients, setSelectedClients] = useState<Cliente[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (squad) {
                form.reset({
                    id: squad.id,
                    name: squad.name,
                    clientIds: squad.squad_clients.map(sc => sc.client_id)
                });
                 setSelectedClients(squad.squad_clients.map(sc => sc.clientes));
            } else {
                form.reset({ id: '', name: '', clientIds: [] });
                setSelectedClients([]);
            }
        }
    }, [isOpen, squad, form]);

    useEffect(() => {
        form.setValue('clientIds', selectedClients.map(c => c.id));
    }, [selectedClients, form]);

    const onSubmit = async (values: z.infer<typeof squadSchema>) => {
        setIsSubmitting(true);
        let error;

        if (squad) { // Edição
            const result = await updateSquad(squad.id, values.name, values.clientIds || []);
            error = result.error;
        } else { // Criação
            const result = await createSquad(values.name, values.clientIds || []);
            error = result.error;
        }
        
        setIsSubmitting(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar squad', description: error.message });
        } else {
            toast({ title: 'Squad Salvo!', description: `O squad "${values.name}" foi salvo com sucesso.` });
            onSuccess();
        }
    };
    
    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{squad ? 'Editar Squad' : 'Criar Novo Squad'}</DialogTitle>
                    <DialogDescription>
                        {squad ? 'Altere o nome e os membros do seu time.' : 'Dê um nome e adicione clientes ao seu novo time.'}
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
                         <FormItem>
                            <FormLabel>Clientes no Squad</FormLabel>
                            <MultiSelectClients
                                allClients={availableClients}
                                selectedClients={selectedClients}
                                onSelectionChange={setSelectedClients}
                            />
                        </FormItem>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {squad ? 'Salvar Alterações' : 'Criar Squad'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function SquadsPage() {
    const [squads, setSquads] = useState<Squad[]>([])
    const [unassignedClients, setUnassignedClients] = useState<Cliente[]>([]);
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);

    const fetchAllData = async () => {
        setIsLoading(true);
        const [{ data: squadsData }, { data: clientsData }] = await Promise.all([getSquads(), getClientsNotInSquads()]);
        setSquads(squadsData || []);
        setUnassignedClients(clientsData || []);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchAllData()
    }, [])

    const handleOpenModal = (squad: Squad | null = null) => {
        setSelectedSquad(squad);
        setIsModalOpen(true);
    }
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSquad(null);
    }
    
    const handleSuccess = () => {
        handleCloseModal();
        fetchAllData();
    }
    
    return (
        <div className="flex flex-1 flex-col">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Squads</h1>
                <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenModal()}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Criar Squad
                        </span>
                    </Button>
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
                                        <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenModal(squad)}>
                                            <Pencil className="mr-2 h-3 w-3"/>
                                            Gerenciar Squad
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
            
            <SquadModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
                squad={selectedSquad}
                unassignedClients={unassignedClients}
            />
        </div>
    )
}
