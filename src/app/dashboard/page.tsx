
'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  Users,
  FileSignature,
  DollarSign,
  BadgeCent,
  AlertTriangle,
  ClipboardList,
  CalendarDays,
  UserPlus,
  FilePlus,
  Receipt,
  Settings,
  Plus,
  CreditCard,
  Pencil,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Progress } from '@/components/ui/progress'
import { getClients } from '@/lib/actions/clients'
import { getContracts } from '@/lib/actions/contratos'
import { getCharges } from '@/lib/actions/cobrancas'
import { getProposals } from '@/lib/actions/propostas'
import { getProfile } from '@/lib/actions/profile'
import { getFinancialGoal } from '@/lib/actions/goals'
import { format, isPast } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Profile, Cliente, Contrato, Cobranca, Proposta, FinancialGoal } from '@/lib/types'
import { DaysOffCalendar } from '@/components/days-off-calendar'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ConfigureBillingModal } from '@/components/configure-billing-modal'
import { AnimatedTooltip } from '@/components/ui/animated-tooltip'
import { SetGoalModal } from '@/components/set-goal-modal'


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
  
const getChargeStatusInfo = (status: string, dueDate: string, isClient: boolean) => {
    if (status === 'pago') {
      return { text: 'Pago', className: 'border-green-500 bg-green-500/10 text-green-700' };
    }
    if (isClient && isPast(new Date(dueDate))) {
      return { text: 'Atrasado', className: 'border-red-500 bg-red-500/10 text-red-700' };
    }
    return { text: 'Pendente', className: 'border-yellow-500 bg-yellow-500/10 text-yellow-700' };
}

export default function DashboardPage() {
    const [clients, setClients] = useState<Cliente[]>([]);
    const [contracts, setContracts] = useState<Contrato[]>([]);
    const [charges, setCharges] = useState<Cobranca[]>([]);
    const [proposals, setProposals] = useState<Proposta[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [financialGoal, setFinancialGoal] = useState<FinancialGoal | null>(null);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    const fetchData = async () => {
        const [
            { data: clientsData }, 
            { data: contractsData }, 
            { data: chargesData }, 
            { data: proposalsData }, 
            { data: profileData },
            { data: goalData }
        ] = await Promise.all([
            getClients(),
            getContracts(),
            getCharges(),
            getProposals(),
            getProfile() as Promise<{ data: Profile | null }>,
            getFinancialGoal()
        ]);
        setClients(clientsData || []);
        setContracts(contractsData || []);
        setCharges(chargesData || []);
        setProposals(proposalsData || []);
        setProfile(profileData);
        setFinancialGoal(goalData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalRevenue = charges?.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.value || 0), 0) || 0;
    
    const pendingCharges = charges?.filter(c => isClient && c.status === 'pendente' && !isPast(new Date(c.due_date))) || [];
    const overdueCharges = charges?.filter(c => isClient && c.status === 'pendente' && isPast(new Date(c.due_date))) || [];

    const pendingAmount = pendingCharges.reduce((sum, c) => sum + (c.value || 0), 0);
    const overdueAmount = overdueCharges.reduce((sum, c) => sum + (c.value || 0), 0);
    
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
            designation: `R$ ${charge.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            image: charge.clientes.avatar_url || `https://i.pravatar.cc/150?u=${charge.clientes.id}`
        }))
    }

    const pendingClientsForTooltip = createTooltipItemsFromCharges(pendingCharges);
    const overdueClientsForTooltip = createTooltipItemsFromCharges(overdueCharges);

    const recentContracts = contracts?.slice(0, 5) || [];
    
    const isProfileComplete = profile?.is_completed ?? false;
    const displayName = profile?.full_name?.split(' ')[0] || (profile?.company_name || 'Bem-vindo(a)');

    const goalAmount = financialGoal?.goal_amount || 0;
    const goalProgress = goalAmount > 0 ? (totalRevenue / goalAmount) * 100 : 0;


  return (
    <>
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
       <div className="flex items-center">
         {isClient && (
            <h1 className="text-lg font-semibold md:text-2xl">
                Olá, {displayName}.
            </h1>
         )}
       </div>

      {isProfileComplete && !profile?.pix_key && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-700">
          <Settings className="h-4 w-4 text-red-700" />
          <AlertTitle className="font-bold">Ação Necessária!</AlertTitle>
          <AlertDescription className="text-red-700">
            Para garantir que você receba pagamentos via PIX, por favor, <Link href="/dashboard/settings/profile" className="underline font-semibold hover:text-red-800">configure sua Chave PIX principal</Link> em seu perfil.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card style={{ backgroundColor: '#4ade80' }} className="text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Faturamento atual
                </CardTitle>
                <DollarSign className="h-4 w-4 text-white/70" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-normal">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <Progress value={goalProgress} className="h-2 mt-4 bg-white" indicatorClassName="bg-[#022c22]" />
                <div className="flex justify-between items-center mt-1">
                    {goalAmount > 0 ? (
                        <p className="text-xs text-white/80">
                            Meta: R$ {goalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    ) : (
                        <div></div> 
                    )}
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-white/80 p-0 h-auto hover:bg-transparent hover:text-white"
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
            <div className="text-2xl font-normal">R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline p-0">
                    Total de valores a receber
                  </AccordionTrigger>
                  <AccordionContent className="bg-muted/50 p-2 rounded-md">
                     <div className="flex flex-row items-center h-10 max-h-14 overflow-x-auto no-scrollbar">
                        {pendingClientsForTooltip.length > 0 ? (
                            <AnimatedTooltip items={pendingClientsForTooltip} />
                        ) : <p className="text-xs text-muted-foreground px-2">Nenhum cliente com cobranças pendentes.</p> }
                    </div>
                  </AccordionContent>
                </AccordionItem>
             </Accordion>
          </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-normal">R$ {overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
             <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline p-0">
                    Total de valores vencidos
                  </AccordionTrigger>
                  <AccordionContent className="bg-muted/50 p-2 rounded-md">
                     <div className="flex flex-row items-center h-10 max-h-14 overflow-x-auto no-scrollbar">
                        {overdueClientsForTooltip.length > 0 ? (
                            <AnimatedTooltip items={overdueClientsForTooltip} />
                        ) : <p className="text-xs text-muted-foreground px-2">Nenhum cliente com cobranças atrasadas.</p> }
                    </div>
                  </AccordionContent>
                </AccordionItem>
             </Accordion>
          </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
            <div className="text-2xl font-normal">{activeClients.length}</div>
            <div className="flex flex-row items-center mt-2 h-10">
                 {activeClients.length > 0 ? (
                    <AnimatedTooltip items={activeClientsForTooltip} />
                 ) : (
                    <div className="flex items-center justify-start h-full">
                        <div className="relative flex items-center -space-x-4">
                           <div className="size-10 rounded-full bg-gray-100 border-2 border-dashed border-gray-200"></div>
                           <Button asChild variant="outline" className="relative rounded-full h-10 w-10 p-0 bg-white shadow-sm -ml-6">
                                <Link href="/dashboard/clientes">
                                    <Plus className="h-5 w-5 text-muted-foreground" />
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
      <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle className="text-base font-semibold">Contratos Recentes</CardTitle>
              <CardDescription>
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
                                    <div className="font-medium">{contract.clientes?.full_name || contract.clientes?.company_name}</div>
                                    <div className="hidden text-sm text-muted-foreground md:inline">
                                    {contract.clientes?.email}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden xl:table-cell">
                                    {contract.contract_code}
                                </TableCell>
                                <TableCell className="hidden xl:table-cell">
                                    <Badge className={cn("text-xs font-normal", getStatusClass(contract.status))} variant="outline">
                                        {getStatusText(contract.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell lg:hidden xl:table-cell">
                                    {isClient && format(new Date(contract.created_at), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell className="text-right">R$ {(contract.propostas?.value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
        <div className="lg:col-span-1 bg-[#ff6d24] text-white rounded-lg flex flex-col">
            <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Folgas e Feriados</CardTitle>
                <CardDescription className="text-white/80">Clique em um dia para marcar como folga.</CardDescription>
            </CardHeader>
            <CardContent>
                <DaysOffCalendar />
            </CardContent>
        </div>
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

    

    
