
'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowUpRight,
  Users,
  FileSignature,
  DollarSign,
  BadgeCent,
  ClipboardList,
  UserPlus,
  FilePlus,
  Settings,
  Plus,
  CreditCard,
  Pencil,
  User as UserIcon,
  ChevronsUpDown,
  Check,
} from 'lucide-react'
import { useState, useEffect } from 'react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { getClients } from '@/lib/actions/clients'
import { getContracts } from '@/lib/actions/contratos'
import { getCharges } from '@/lib/actions/cobrancas'
import { getProposals } from '@/lib/actions/propostas'
import { getProfile } from '@/lib/actions/profile'
import { getFinancialGoal } from '@/lib/actions/goals'
import { getTasks, createTask, updateTask } from '@/lib/actions/tasks'
import { format, isPast } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Profile, Cliente, Contrato, Cobranca, Proposta, FinancialGoal, Task } from '@/lib/types'
import { DaysOffCalendar } from '@/components/days-off-calendar'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ConfigureBillingModal } from '@/components/configure-billing-modal'
import { AnimatedTooltip } from '@/components/ui/animated-tooltip'
import { SetGoalModal } from '@/components/set-goal-modal'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'

import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { Skeleton } from '@/components/ui/skeleton'

function DashboardSkeleton() {
    return (
        <div className="flex flex-1 flex-col gap-4 sm:gap-6">
            <div className="flex items-center">
                <Skeleton className="h-8 w-40 rounded-lg" />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Skeleton className="h-[180px] w-full rounded-lg" />
                <Skeleton className="h-[180px] w-full rounded-lg" />
                <Skeleton className="h-[180px] w-full rounded-lg" />
                <Skeleton className="h-[180px] w-full rounded-lg" />
            </div>

             <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
                <Skeleton className="h-96 w-full rounded-lg" />
                <Skeleton className="h-96 w-full rounded-lg" />
             </div>
        </div>
    )
}

const getStatusClass = (status: string) => {
    switch (status) {
      case 'signed_by_client':
        return 'border-green-500 bg-green-500/10 text-green-700'
      case 'signed_by_provider':
        return 'border-orange-500 bg-orange-500/10 text-orange-700'
      case 'draft':
        return 'border-gray-500 bg-gray-500/10 text-gray-700'
      default:
        return 'border-gray-500 bg-gray-500/10 text-gray-700'
    }
}

const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho'
      case 'signed_by_provider': return 'Aguardando Cliente'
      case 'signed_by_client': return 'Finalizado'
      default: return 'Desconhecido'
    }
}
  
const getChargeStatusInfo = (status: string, dueDate: string, isClientSide: boolean) => {
    if (!isClientSide) {
      return { text: 'Carregando...', className: 'border-gray-500 bg-gray-500/10 text-gray-700' };
    }
    if (status === 'pago') {
      return { text: 'Pago', className: 'border-green-500 bg-green-500/10 text-green-700' };
    }
    if (isPast(new Date(dueDate))) {
      return { text: 'Atrasado', className: 'border-red-500 bg-red-500/10 text-red-700' };
    }
    return { text: 'Pendente', className: 'border-yellow-500 bg-yellow-500/10 text-yellow-700' };
}

function TaskList({ tasks, clients, onTaskUpdate, onTaskCreate }: { tasks: Task[], clients: Cliente[], onTaskUpdate: (id: string, is_completed: boolean) => void, onTaskCreate: (description: string, clientId: string | null) => void }) {
    const { register, handleSubmit, reset, setValue, watch, getValues } = useForm<{ description: string; clientId: string | null }>({
        defaultValues: { description: '', clientId: null }
    });
    const [open, setOpen] = useState(false);

    const selectedClientId = watch('clientId');
    const selectedClient = clients.find(c => c.id === selectedClientId);

    const handleCreateOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const values = getValues();
            if (values.description.trim()) {
                onTaskCreate(values.description, values.clientId);
                reset({ description: '', clientId: values.clientId }); 
            }
        }
    }
    
    const clientForAvatar = (task: Task) => {
        if (!task.clientes) return [];
        return [{
            id: task.clientes.id,
            name: task.clientes.full_name || task.clientes.company_name || 'Cliente',
            designation: `Tarefa: ${'task.description'.substring(0, 20)}...`,
            image: task.clientes.avatar_url || `https://i.pravatar.cc/150?u=${'task.clientes.id'}`
        }]
    };

    return (
        <div className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="text-lg font-normal">Lista de Tarefas</CardTitle>
                <CardDescription as="div" className="text-sm text-muted-foreground">
                     <div className="relative">
                        <Input 
                            {...register("description")} 
                            placeholder="Aperte ENTER para adicionar" 
                            className="h-9 pr-12 rounded-full"
                            onKeyDown={handleCreateOnEnter}
                        />
                         <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                               <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full">
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage src={selectedClient?.avatar_url || ''} />
                                        <AvatarFallback className="bg-muted text-muted-foreground">
                                            <UserIcon className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                               </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[250px] p-0">
                                 <Command>
                                    <CommandInput placeholder="Vincular cliente..." />
                                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                    <CommandGroup>
                                    <CommandItem
                                        onSelect={() => {
                                            setValue('clientId', null);
                                            setOpen(false);
                                        }}
                                    >
                                        Geral (sem vínculo)
                                    </CommandItem>
                                    {clients.map(client => (
                                        <CommandItem
                                            key={client.id}
                                            value={client.id}
                                            onSelect={() => {
                                                setValue('clientId', client.id)
                                                setOpen(false)
                                            }}
                                        >
                                         <Check className={cn("mr-2 h-4 w-4", selectedClientId === client.id ? "opacity-100" : "opacity-0")} />
                                          {client.full_name || client.company_name}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardDescription>
            </CardHeader>
             <CardContent className="p-0 flex-1 overflow-y-auto px-4">
                {tasks.length > 0 ? tasks.map(task => (
                    <div key={task.id} className="flex items-center space-x-3 py-2.5 border-b last:border-b-0">
                        <Checkbox 
                            id={`task-${task.id}`} 
                            checked={task.is_completed}
                            onCheckedChange={(checked) => onTaskUpdate(task.id, !!checked)}
                        />
                        <label
                            htmlFor={`task-${task.id}`}
                            className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1", task.is_completed && "line-through text-muted-foreground")}
                        >
                            {task.description}
                        </label>
                        {task.clientes && (
                            <div className="flex items-center ml-auto pr-2">
                                <AnimatedTooltip items={clientForAvatar(task)} direction="left" />
                            </div>
                        )}
                    </div>
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa encontrada.</p>
                )}
            </CardContent>
        </div>
    )
}

export default function DashboardPage() {
    const [clients, setClients] = useState<Cliente[]>([]);
    const [contracts, setContracts] = useState<Contrato[]>([]);
    const [charges, setCharges] = useState<Cobranca[]>([]);
    const [proposals, setProposals] = useState<Proposta[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [financialGoal, setFinancialGoal] = useState<FinancialGoal | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isClientSide, setIsClientSide] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      setIsClientSide(true);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        const [
            { data: clientsData }, 
            { data: contractsData }, 
            { data: chargesData }, 
            { data: proposalsData }, 
            { data: profileData },
            { data: goalData },
            { data: tasksData }
        ] = await Promise.all([
            getClients(),
            getContracts(),
            getCharges(),
            getProposals(),
            getProfile() as Promise<{ data: Profile | null }>,
            getFinancialGoal(),
            getTasks()
        ]);
        setClients(clientsData || []);
        setContracts(contractsData || []);
        setCharges(chargesData || []);
        setProposals(proposalsData || []);
        setProfile(profileData);
        setFinancialGoal(goalData);
        setTasks(tasksData || []);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTaskUpdate = async (id: string, is_completed: boolean) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, is_completed } : t)); // Optimistic update
        await updateTask(id, is_completed);
        await fetchData(); // Resync with DB
    };

    const handleTaskCreate = async (description: string, clientId: string | null) => {
        if (!description.trim()) return;
        await createTask(description, clientId);
        await fetchData();
    };

    const totalRevenue = charges?.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.value || 0), 0) || 0;
    
    const pendingCharges = charges?.filter(c => c.status === 'pendente' && (!isClientSide || !isPast(new Date(c.due_date)))) || [];
    
    const pendingAmount = pendingCharges.reduce((sum, c) => sum + (c.value || 0), 0);
    
    const activeClients = clients?.filter(c => c.billing_status === 'active') || [];

    const activeClientsForTooltip = activeClients.map(client => ({
      id: client.id,
      name: client.full_name || client.company_name || 'Cliente',
      designation: client.email || 'E-mail não informado',
      image: client.avatar_url || `https://i.pravatar.cc/150?u=${client.id}`,
    }));
    
    const createTooltipItemsFromCharges = (chargeList: Cobranca[]) => {
        return chargeList.map(charge => ({
            id: charge.clientes.id,
            name: charge.clientes.full_name || charge.clientes.company_name || 'Cliente',
            designation: `R$ ${(charge.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            image: charge.clientes.avatar_url || `https://i.pravatar.cc/150?u=${'charge.clientes.id'}`
        }))
    }

    const pendingClientsForTooltip = createTooltipItemsFromCharges(pendingCharges);

    const recentContracts = contracts?.slice(0, 5) || [];
    
    const isProfileComplete = profile?.is_completed ?? false;
    
    const goalAmount = financialGoal?.goal_amount || 0;
    const goalProgress = goalAmount > 0 ? (totalRevenue / goalAmount) * 100 : 0;

  if (isLoading) {
      return <DashboardSkeleton />;
  }
  
  return (
    <>
    <div className="flex flex-1 flex-col gap-4">
      {isProfileComplete && !profile?.pix_key && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-700">
          <Settings className="h-4 w-4 text-red-700" />
          <AlertTitle className="font-bold">Ação Necessária!</AlertTitle>
          <AlertDescription className="text-sm">
            Para garantir que você receba pagamentos via PIX, por favor, <Link href="/dashboard/settings/profile" className="underline font-semibold hover:text-red-800">configure sua Chave PIX principal</Link> em seu perfil.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card className="border p-0 overflow-hidden">
            <Link href="/dashboard/settings/buy-credits" className="block w-full h-full">
                <Image 
                    src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/banner%20pqueno%20(2).png"
                    alt="Banner para comprar créditos"
                    width={300}
                    height={150}
                    className="w-full h-full object-cover"
                />
            </Link>
        </Card>
        <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Faturamento atual
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <Progress value={goalProgress} className="h-2 mt-4" indicatorClassName="bg-primary" />
                <div className="flex justify-between items-center mt-1">
                    {goalAmount > 0 ? (
                        <p className="text-xs text-muted-foreground">
                            Meta: R$ {goalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    ) : (
                        <div></div> 
                    )}
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-muted-foreground p-0 h-auto hover:bg-transparent hover:text-primary"
                        onClick={() => setIsGoalModalOpen(true)}
                    >
                        <Pencil className="mr-1 h-3 w-3" />
                        {goalAmount > 0 ? 'Editar meta' : 'Adicionar meta'}
                    </Button>
                </div>
            </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cobranças Pendentes
            </CardTitle>
            <BadgeCent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
             <p className="text-xs text-muted-foreground">
                Total de valores a receber
              </p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
            <div className="text-2xl font-bold">{activeClients.length}</div>
            <div className="flex flex-row items-center mt-2 h-10">
                 {activeClients.length > 0 ? (
                    <AnimatedTooltip items={activeClientsForTooltip} direction="right"/>
                 ) : (
                    <div className="flex items-center justify-start h-full">
                        <div className="relative flex items-center -space-x-4">
                           <div className="size-8 rounded-full bg-gray-100 border-2 border-dashed border-gray-200"></div>
                           <Button asChild variant="outline" className="relative rounded-full h-8 w-8 p-0 bg-white shadow-sm -ml-5">
                                <Link href="/dashboard/clientes">
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                    <span className="sr-only">Adicionar Cliente</span>
                                </Link>
                           </Button>
                        </div>
                   </div>
                 )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-1 border h-96">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle className="text-lg font-normal">Contratos Recentes</CardTitle>
              <CardDescription className="text-sm">
                Os últimos contratos gerados no sistema.
              </CardDescription>
            </div>
            {isProfileComplete ? (
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/dashboard/contratos">
                  Ver Todos
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button size="sm" className="ml-auto gap-1" disabled>
                Ver Todos
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
             {recentContracts.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="hidden xl:table-cell">
                            Código
                        </TableHead>
                        <TableHead className="hidden xl:table-cell">
                            Status
                        </TableHead>
                        <TableHead className="hidden xl:table-cell">
                            Data
                        </TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentContracts.map(contract => (
                            <TableRow key={contract.id}>
                                <TableCell>
                                    <div className="font-medium text-sm">{contract.clientes?.full_name || contract.clientes?.company_name}</div>
                                    <div className="hidden text-xs text-muted-foreground md:inline">
                                    {contract.clientes?.email}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden xl:table-cell text-muted-foreground">
                                    {contract.contract_code}
                                </TableCell>
                                <TableCell className="hidden xl:table-cell">
                                    <Badge className={cn("font-normal", getStatusClass(contract.status))} variant="outline">
                                        {getStatusText(contract.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell lg:hidden xl:table-cell text-muted-foreground">
                                    {isClientSide && format(new Date(contract.created_at), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">R$ {(contract.propostas?.value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-center py-12">
                    <FileSignature className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Nenhum contrato gerado ainda.</p>
                     {isProfileComplete ? (
                        <Button asChild size="sm" className="mt-2">
                           <Link href="/dashboard/contratos">
                               Gerar Contrato
                           </Link>
                       </Button>
                     ) : (
                        <Button size="sm" className="mt-2" disabled>
                            Gerar Contrato
                        </Button>
                     )}
                </div>
             )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 border h-96">
           <TaskList tasks={tasks} clients={clients} onTaskUpdate={handleTaskUpdate} onTaskCreate={handleTaskCreate} />
        </Card>
      </div>
    </div>
     <ConfigureBillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        clientId={null} // Permite selecionar qualquer cliente
        clients={clients}
        proposals={proposals}
        onBillingConfigured={fetchData}
      />
      <SetGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onGoalSet={fetchData}
        currentGoal={financialGoal}
      />
    </>
  )
}
