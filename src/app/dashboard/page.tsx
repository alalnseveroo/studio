
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
  PlusCircle,
  CreditCard,
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
import { getClients } from '@/lib/actions/clients'
import { getContracts } from '@/lib/actions/contratos'
import { getCharges } from '@/lib/actions/cobrancas'
import { getProposals } from '@/lib/actions/propostas'
import { getProfile } from '@/lib/actions/profile'
import { format, isPast } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Profile, Cliente, Contrato, Cobranca, Proposta } from '@/lib/types'
import { DaysOffCalendar } from '@/components/days-off-calendar'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ConfigureBillingModal } from '@/components/configure-billing-modal'


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
  
const getChargeStatusInfo = (status: string, dueDate: string) => {
    if (status === 'pago') {
      return { text: 'Pago', className: 'border-green-500 bg-green-500/10 text-green-700' };
    }
    if (isPast(new Date(dueDate))) {
      return { text: 'Atrasado', className: 'border-red-500 bg-red-500/10 text-red-700' };
    }
    return { text: 'Pendente', className: 'border-yellow-500 bg-yellow-500/10 text-yellow-700' };
}

const QuickActionButton = ({ href, icon: Icon, label, onClick }: { href?: string, icon: React.ElementType, label: string, onClick?: () => void }) => {
    const content = (
        <div className="flex items-center gap-2">
            <Icon className="h-0 w-0 opacity-0 transition-all duration-300 group-hover:h-4 group-hover:w-4 group-hover:opacity-100" />
            <span className="text-sm font-normal">{label}</span>
        </div>
    );
    
    if (href) {
        return (
            <Button asChild variant="outline" className="h-10 shadow-sm hover:shadow-md transition-all group">
                <Link href={href}>{content}</Link>
            </Button>
        );
    }

    return (
        <Button variant="outline" className="h-10 shadow-sm hover:shadow-md transition-all group" onClick={onClick}>
            {content}
        </Button>
    );
};


export default function DashboardPage() {
    const [clients, setClients] = useState<Cliente[]>([]);
    const [contracts, setContracts] = useState<Contrato[]>([]);
    const [charges, setCharges] = useState<Cobranca[]>([]);
    const [proposals, setProposals] = useState<Proposta[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

    const fetchData = async () => {
        const [{ data: clientsData }, { data: contractsData }, { data: chargesData }, { data: proposalsData }, { data: profileData }] = await Promise.all([
            getClients(),
            getContracts(),
            getCharges(),
            getProposals(),
            getProfile() as Promise<{ data: Profile | null }>
        ]);
        setClients(clientsData || []);
        setContracts(contractsData || []);
        setCharges(chargesData || []);
        setProposals(proposalsData || []);
        setProfile(profileData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalRevenue = charges?.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.value || 0), 0) || 0;
    const pendingAmount = charges?.filter(c => c.status === 'pendente' && !isPast(new Date(c.due_date))).reduce((sum, c) => sum + (c.value || 0), 0) || 0;
    const overdueAmount = charges?.filter(c => c.status === 'pendente' && isPast(new Date(c.due_date))).reduce((sum, c) => sum + (c.value || 0), 0) || 0;
    const activeClients = clients?.filter(c => c.billing_status === 'active').length || 0;

    const recentContracts = contracts?.slice(0, 5) || [];
    
    const isProfileComplete = profile?.is_completed ?? false;

  return (
    <>
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
         <div className="ml-auto flex items-center gap-2">
            <QuickActionButton href="/dashboard/clientes" icon={UserPlus} label="Criar Cliente" />
            <QuickActionButton href="/dashboard/contratos" icon={FileSignature} label="Criar Contrato" />
            <QuickActionButton onClick={() => setIsBillingModalOpen(true)} icon={CreditCard} label="Enviar Cobrança" />
            <QuickActionButton href="/dashboard/settings/profile" icon={Settings} label="Configurações" />
        </div>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Total (Pago)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              Total de valores recebidos
            </p>
          </CardContent>
        </Card>
        <Card>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              Total de valores vencidos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes com cobrança recorrente
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Contratos Recentes</CardTitle>
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
                                    {format(new Date(contract.created_at), 'dd/MM/yyyy')}
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
        <div className="lg:col-span-1 bg-black text-white rounded-lg flex flex-col">
            <CardHeader>
                <CardTitle className="text-white">Folgas e Feriados</CardTitle>
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
    </>
  )
}
