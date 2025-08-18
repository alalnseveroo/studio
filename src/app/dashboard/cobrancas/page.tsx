
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
import { Loader2, Send, FileWarning, UserPlus, FilePlus, Link2, MoreVertical, BadgeCheck, Upload, Download } from 'lucide-react'
import { getCharges, markChargeAsPaid } from '@/lib/actions/cobrancas'
import type { Cobranca, Profile } from '@/lib/types'
import { format, isPast } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { sendTransactionalEmail } from '@/lib/brevo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { UploadInvoiceModal } from '@/components/upload-invoice-modal'
import { getProfile } from '@/lib/actions/profile'
import { InvoiceTooltip } from '@/components/invoice-tooltip'
import Link from 'next/link'


export default function CobrancasPage() {
  const [charges, setCharges] = useState<Cobranca[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState<string | null>(null);
  const [selectedChargeForInvoice, setSelectedChargeForInvoice] = useState<Cobranca | null>(null)
  const [providerProfile, setProviderProfile] = useState<Profile | null>(null)
  const { toast } = useToast()

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
      setIsLoading(true)
      const [{ data: chargesData, error: chargesError }, { data: profileData }] = await Promise.all([
        getCharges(),
        getProfile()
      ]);

      if (chargesError || !chargesData) {
        toast({
            variant: 'destructive',
            title: 'Erro ao buscar dados',
            description: chargesError?.message || 'Não foi possível carregar as cobranças.'
        })
        setIsLoading(false)
        return
      }
      
      setCharges(chargesData);
      setProviderProfile(profileData as Profile | null);
      setIsLoading(false)
    }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSendReminder = async (charge: Cobranca) => {
      setIsSending(charge.id);
      
      if (!charge.clientes?.email || !providerProfile) {
          toast({ variant: 'destructive', title: "Dados Incompletos", description: `Não foi possível enviar o lembrete. Verifique o e-mail do cliente e o perfil da contratada.` });
          setIsSending(null);
          return;
      }
      
      const portalUrl = new URL(`/portal/${charge.cliente_id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();
      const BREVO_TEMPLATE_ID = 63; // Lembrete Manual / Cobrança imediata

      try {
        await sendTransactionalEmail({
          toEmail: charge.clientes.email,
          templateId: BREVO_TEMPLATE_ID,
          params: {
              CLIENTE_NOME: charge.clientes.full_name || charge.clientes.company_name,
              CONTRATADA_NOME: providerProfile.full_name || providerProfile.company_name,
              COBRANCA_VALOR: (charge.value || 0).toFixed(2),
              COBRANCA_VENCIMENTO: format(new Date(charge.due_date), 'dd/MM/yyyy'),
              LINK_PORTAL: portalUrl,
          },
          userId: charge.user_id 
        });
        
        toast({
            title: "E-mail de Cobrança Enviado!",
            description: `A cobrança foi enviada para ${charge.clientes.full_name || charge.clientes.company_name}.`
        });

      } catch (error: any) {
          toast({
              variant: 'destructive',
              title: "Erro ao enviar e-mail",
              description: error.message || "Não foi possível enviar o e-mail."
          })
      } finally {
        setIsSending(null);
      }
  }

  const handleMarkAsPaid = async (chargeId: string) => {
    setIsLoading(true);
    const { error } = await markChargeAsPaid(chargeId);
     if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'Cobrança marcada como paga.' });
      await fetchData(); // Refetch charges
    }
    setIsLoading(false);
  }

  return (
    <>
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-10">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Gestão de Cobranças</h1>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Como Funciona a Cobrança?</CardTitle>
                <CardDescription>Siga os passos no botão "Adicionar Cliente" para criar uma nova cobrança.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-3">
                <div className="flex items-start gap-4">
                    <UserPlus className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">1. Cadastre o Cliente</h4>
                        <p className="text-sm text-muted-foreground">Adicione um novo cliente e preencha seus dados básicos.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <FilePlus className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">2. Defina a Cobrança</h4>
                        <p className="text-sm text-muted-foreground">Use uma proposta ou defina um valor e data de início.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Link2 className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">3. Revise e Ative</h4>
                        <p className="text-sm text-muted-foreground">Confirme os dados e ative a automação, que aparecerá aqui.</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Tabs defaultValue="recorrentes" className="w-full">
            <TabsList>
                <TabsTrigger value="recorrentes">Cobranças Recorrentes</TabsTrigger>
                <TabsTrigger value="historico" disabled>Histórico de Envios (em breve)</TabsTrigger>
            </TabsList>
            <TabsContent value="recorrentes">
                {isLoading ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
                ) : charges.length === 0 ? (
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
                        <CardTitle>Próximas Cobranças</CardTitle>
                        <CardDescription>
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
                          const status = getStatusInfo(charge.status, charge.due_date);
                          const clientName = charge.clientes.full_name || charge.clientes.company_name;

                          return (
                            <TableRow key={charge.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={charge.clientes.avatar_url || ''} alt={`Avatar de ${clientName}`} />
                                    <AvatarFallback>{(clientName || 'C').charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{clientName}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {format(new Date(charge.due_date), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell>
                                {charge.value ? `${Number(charge.value).toFixed(2)}` : 'N/A'}
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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={isSending === charge.id}>
                                            {isSending === charge.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => setSelectedChargeForInvoice(charge)}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Substituir NF-e
                                        </DropdownMenuItem>
                                        {charge.status === 'pendente' && (
                                            <DropdownMenuItem onSelect={() => handleMarkAsPaid(charge.id)}>
                                                <BadgeCheck className="mr-2 h-4 w-4" />
                                                Marcar como pago
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onSelect={() => handleSendReminder(charge)} disabled={!providerProfile}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Enviar lembrete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
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

    {selectedChargeForInvoice && (
        <UploadInvoiceModal
            isOpen={!!selectedChargeForInvoice}
            onClose={() => setSelectedChargeForInvoice(null)}
            charge={selectedChargeForInvoice}
            onUploadSuccess={fetchData}
        />
    )}
    </>
  )
}
