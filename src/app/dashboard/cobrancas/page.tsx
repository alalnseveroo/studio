
'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, FileWarning, UserPlus, FilePlus, Link2, BadgeCheck, PlusCircle } from 'lucide-react'
import { getCharges, markChargeAsPaid } from '@/lib/actions/cobrancas'
import type { Cobranca, Profile, Cliente, Proposta } from '@/lib/types'
import { format, isPast } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { sendTransactionalEmail } from '@/lib/brevo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getProfile } from '@/lib/actions/profile'
import { getClients } from '@/lib/actions/clients'
import { getProposals } from '@/lib/actions/propostas'
import { InvoiceTooltip } from '@/components/invoice-tooltip'
import Link from 'next/link'
import { ConfigureBillingModal } from '@/components/configure-billing-modal'
import { Skeleton } from '@/components/ui/skeleton'


function ChargesTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                            <TableHead className="text-center"><Skeleton className="h-5 w-20" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 3 }).map((_, i) => (
                             <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20 rounded-md" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
                                <TableCell><div className="flex justify-center gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default function CobrancasPage() {
  const [charges, setCharges] = useState<Cobranca[]>([])
  const [clients, setClients] = useState<Cliente[]>([])
  const [proposals, setProposals] = useState<Proposta[]>([])
  const [isSending, setIsSending] = useState<string | null>(null);
  const [providerProfile, setProviderProfile] = useState<Profile | null>(null)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false)
  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    setIsClientSide(true);
  }, [])

  const getStatusInfo = (status: string, dueDate: string) => {
    if (status === 'pago') {
      return { text: 'Pago', className: 'border-green-500 bg-green-500/10 text-green-700' };
    }
    if (isPast(new Date(dueDate))) {
      return { text: 'Atrasado', className: 'border-red-500 bg-red-500/10 text-red-700' };
    }
    return { text: 'Pendente', className: 'border-yellow-500 bg-yellow-500/10 text-yellow-700' };
  }

  const fetchData = async () => {
      setIsLoading(true);
      const [{ data: chargesData, error: chargesError }, { data: profileData }, { data: clientsData }, { data: proposalsData }] = await Promise.all([
        getCharges(),
        getProfile(),
        getClients(),
        getProposals(),
      ]);

      if (chargesError || !chargesData) {
        toast({
            variant: 'destructive',
            title: 'Erro ao buscar dados',
            description: chargesError?.message || 'Não foi possível carregar as cobranças.'
        })
      } else {
        setCharges(chargesData);
      }
      
      setProviderProfile(profileData as Profile | null);
      setClients(clientsData || [])
      setProposals(proposalsData || [])
      setIsLoading(false);
    }

  useEffect(() => {
    fetchData()
  }, [])

  const handleMarkAsPaid = async (chargeId: string) => {
    const { error } = await markChargeAsPaid(chargeId);
     if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'Cobrança marcada como paga.' });
      await fetchData(); // Refetch charges
    }
  }

  const handleSendReminder = async (charge: Cobranca) => {
    if (!charge.clientes?.email || !providerProfile) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Informações do cliente ou do prestador de serviço estão faltando.' });
      return;
    }
    setIsSending(charge.id);
    try {
      const portalUrl = new URL(`/portal/${charge.cliente_id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();
      await sendTransactionalEmail({
        toEmail: charge.clientes.email,
        templateId: 61,
        params: {
          CLIENTE_NOME: charge.clientes.full_name || charge.clientes.company_name,
          CONTRATADA_NOME: providerProfile.full_name || providerProfile.company_name,
          COBRANCA_VALOR: (charge.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          COBRANCA_VENCIMENTO: format(new Date(charge.due_date + 'T00:00:00'), 'dd/MM/yyyy'),
          LINK_PORTAL: portalUrl,
        },
        userId: charge.user_id,
      });
      toast({ title: 'Lembrete Enviado!', description: `E-mail de lembrete enviado para ${charge.clientes.email}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao Enviar', description: error.message });
    } finally {
      setIsSending(null);
    }
  };


  return (
    <>
    <div className="flex flex-1 flex-col">
        <div className="flex items-center">
            <h1 className="text-2xl font-bold">Gestão de Cobranças</h1>
            <div className="ml-auto">
                <Button size="sm" onClick={() => setIsBillingModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Enviar Cobrança
                </Button>
            </div>
        </div>

        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-lg">Como Funciona a Cobrança?</CardTitle>
                <CardDescription className="text-sm">Siga os passos no botão "Adicionar Cliente" para criar uma nova cobrança.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-3">
                <div className="flex items-start gap-4">
                    <UserPlus className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-sm">1. Cadastre o Cliente</h4>
                        <p className="text-xs text-muted-foreground">Adicione um novo cliente e preencha seus dados básicos.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <FilePlus className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-sm">2. Defina a Cobrança</h4>
                        <p className="text-xs text-muted-foreground">Use uma proposta ou defina um valor e data de início.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Link2 className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-sm">3. Revise e Ative</h4>
                        <p className="text-xs text-muted-foreground">Confirme os dados e ative a automação, que aparecerá aqui.</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Tabs defaultValue="recorrentes" className="w-full mt-6">
            <TabsList>
                <TabsTrigger value="recorrentes">Cobranças Recorrentes</TabsTrigger>
                <TabsTrigger value="historico" disabled>Histórico de Envios (em breve)</TabsTrigger>
            </TabsList>
            <TabsContent value="recorrentes">
                {isLoading ? <ChargesTableSkeleton /> : charges.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                    <div className="flex flex-col items-center gap-1 text-center">
                    <FileWarning className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-2xl font-bold tracking-tight">
                        Nenhuma cobrança recorrente ativa
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Clique em "Adicionar Cliente" na página de Clientes para configurar uma nova cobrança.
                    </p>
                    </div>
                </div>
                ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Próximas Cobranças</CardTitle>
                        <CardDescription className="text-sm">
                            Listagem de cobranças pendentes. As cobranças são geradas automaticamente para clientes ativos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Valor (R$)</TableHead>
                            <TableHead>Status Pag.</TableHead>
                            <TableHead>NF-e</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {charges.map((charge) => {
                          if (!charge.clientes) return null; // Safety check
                          const status = isClientSide ? getStatusInfo(charge.status, charge.due_date) : { text: '', className: '' };
                          const clientName = charge.clientes.full_name || charge.clientes.company_name;

                          return (
                            <TableRow key={charge.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={charge.clientes.avatar_url || ''} alt={`Avatar de ${clientName}`} />
                                    <AvatarFallback>{(clientName || 'C').charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{clientName}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {isClientSide ? format(new Date(charge.due_date), 'dd/MM/yyyy') : ''}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {charge.value ? `${Number(charge.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("font-normal", status.className)}>{status.text}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {charge.invoice_url ? (
                                        <Link href={charge.invoice_url} target="_blank" rel="noopener noreferrer">
                                            <Badge variant="secondary" className="border-blue-500 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20">Anexada</Badge>
                                        </Link>
                                    ) : (
                                        <Badge variant="outline">Pendente</Badge>
                                    )}
                                    <InvoiceTooltip charge={charge} onUploadSuccess={fetchData} />
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                 <div className="flex items-center justify-center">
                                     {charge.status === 'pendente' && (
                                        <Button variant="ghost" size="icon" onClick={() => handleSendReminder(charge)} disabled={isSending === charge.id}>
                                            <Send className="h-4 w-4" />
                                            <span className="sr-only">Enviar Lembrete</span>
                                        </Button>
                                     )}
                                     {charge.status === 'pendente' && (
                                         <Button variant="ghost" size="icon" onClick={() => handleMarkAsPaid(charge.id)}>
                                            <BadgeCheck className="h-4 w-4" />
                                            <span className="sr-only">Marcar como pago</span>
                                        </Button>
                                     )}
                                 </div>
                            </TableCell>
                            </TableRow>
                         )
                        })}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                )}
            </TabsContent>
            <TabsContent value="historico">
                 <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                    <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                        Em breve
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Aqui você poderá ver o histórico de todos os e-mails de cobrança enviados.
                    </p>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    </div>

    <ConfigureBillingModal
      isOpen={isBillingModalOpen}
      onClose={() => setIsBillingModalOpen(false)}
      onBillingConfigured={fetchData}
      clientId={null}
      clients={clients}
      proposals={proposals}
    />
    </>
  )
}
