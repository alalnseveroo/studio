

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getClientByIdForPortal } from '@/lib/actions/clients'
import { getContractsForClientPortal } from '@/lib/actions/contratos'
import { getChargesForClientPortal } from '@/lib/actions/cobrancas'
import { getProfileForPortal } from '@/lib/actions/profile'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, User, FileText, Check, Clock, Verified, Briefcase, Mail, Download, CreditCard, Lock, Loader2, DollarSign, Calendar, CheckCircle, MessageSquare, ArrowUpRight, X, Info } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { Cliente, Contrato, Profile, Cobranca, Proposta } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { format, isPast } from 'date-fns'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { ChatInterface } from '@/components/chat-interface'
import { PortalCalendar } from '@/components/portal-calendar'
import { StaticPixQRCode } from '@/components/static-pix-qrcode'
import { Skeleton } from '@/components/ui/skeleton'

function PortalSkeleton() {
    return (
         <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1 animate-pulse">
            <div className="flex flex-wrap justify-between gap-3 p-4">
                <Skeleton className="h-10 w-72 rounded-lg" />
            </div>
            
            <Skeleton className="h-8 w-60 rounded-lg mx-4 my-5" />
            <div className="p-4">
                <Skeleton className="h-40 w-full rounded-lg" />
            </div>

            <Skeleton className="h-8 w-60 rounded-lg mx-4 my-5" />
            <div className="p-4 space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            <Skeleton className="h-8 w-60 rounded-lg mx-4 my-5" />
             <div className="px-4 py-3">
                 <Skeleton className="h-48 w-full rounded-lg" />
             </div>
          </div>
        </div>
    )
}

export default function ClientPortalPage() {
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<Cliente | null>(null)
  const [provider, setProvider] = useState<(Profile & {email: string}) | null>(null)
  const [contracts, setContracts] = useState<Contrato[]>([])
  const [charges, setCharges] = useState<Cobranca[]>([])
  const [selectedCharge, setSelectedCharge] = useState<Cobranca | null>(null);
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [activeContractTab, setActiveContractTab] = useState<'pending' | 'contracted'>('pending');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  const { toast } = useToast()
  
  const getStatusInfo = (status: string, dueDate: string) => {
    if (!isClientSide) {
      return { text: 'Carregando...', className: 'bg-gray-100 text-gray-800' };
    }
    if (status === 'pago') {
      return { text: 'Pago', className: 'bg-green-100 text-green-800' };
    }
    if (isPast(new Date(dueDate))) {
      return { text: 'Atrasado', className: 'bg-red-100 text-red-800' };
    }
    return { text: 'Pendente', className: 'bg-yellow-100 text-yellow-800' };
  }

  const fetchData = useCallback(async () => {
    if (!clientId) return
    setError(null)
    
    try {
        const { data: clientData, error: clientError } = await getClientByIdForPortal(clientId);
        if (clientError || !clientData) {
            throw new Error('Não foi possível carregar os dados do cliente.');
        }
        setClient(clientData);

        if (clientData.user_id) {
            const { data: providerData, error: providerError } = await getProfileForPortal(clientData.user_id);
            if (providerError || !providerData) {
                 console.error("Could not fetch provider profile for portal", providerError);
            } else {
                setProvider(providerData as Profile & { email: string });
            }
        }

        const [{ data: contractsData, error: contractsError }, { data: chargesData, error: chargesError }] = await Promise.all([
            getContractsForClientPortal(clientId),
            getChargesForClientPortal(clientId)
        ]);

        if (contractsError) console.error('Could not fetch contracts for portal', contractsError)
        setContracts(contractsData || []);
        
        if (chargesError) console.error('Could not fetch charges for portal', chargesError)
        setCharges(chargesData || []);

    } catch (e: any) {
        setError(e.message);
    } finally {
        setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    setIsLoading(true);
    fetchData()
  }, [fetchData]) 

  const handleDownloadClick = (charge: Cobranca) => {
    if (charge.invoice_url) {
        window.open(charge.invoice_url, '_blank');
    } else {
        toast({
            variant: 'destructive',
            title: 'Download Indisponível',
            description: 'A nota fiscal para esta cobrança ainda não está disponível.',
        });
    }
  };


  if (isLoading) {
    return (
        <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] px-10 py-3">
                 <div className="flex items-center gap-4 text-[#111418]">
                    <Skeleton className="h-6 w-20" />
                 </div>
                 <div className="flex items-center gap-9">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </header>
            <PortalSkeleton />
        </div>
    )
  }

  if (error || !client) {
     return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4">
             <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>
                    {error || 'Cliente não encontrado.'} <Link href="/" className="font-bold underline">Voltar</Link>.
                </AlertDescription>
            </Alert>
        </div>
     )
  }

  const displayName = client.full_name || client.company_name || 'Cliente';
  const providerName = provider?.full_name || provider?.company_name || 'Assistente Virtual';
  
  const activeProposal = contracts.length > 0 ? contracts.find(c => c.status === 'signed_by_client')?.propostas || contracts[0].propostas : null;
  const pendingContracts = contracts.filter(c => c.status === 'signed_by_provider');
  const contractedContracts = contracts.filter(c => c.status === 'signed_by_client');

  const getContractStatusInfo = (status: string) => {
    switch(status) {
        case 'signed_by_provider': return { text: 'Pendente', className: 'bg-[#f0f2f5] text-[#111418]'};
        case 'signed_by_client': return { text: 'Contratado', className: 'bg-green-100 text-green-800'};
        default: return { text: 'Rascunho', className: 'bg-gray-100 text-gray-800'};
    }
  }


  return (
    <>
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] px-10 py-3">
          <div className="flex items-center gap-4 text-[#111418]">
            <div className="size-6">
                 <Image 
                    src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/Crivo.png" 
                    alt="Crivo Logo"
                    width={80}
                    height={30}
                />
            </div>
            <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">Portal do Cliente</h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a className="text-[#111418] text-sm font-medium leading-normal" href="#proposta">Proposta</a>
              <a className="text-[#111418] text-sm font-medium leading-normal" href="#contratos">Contratos</a>
              <a className="text-[#111418] text-sm font-medium leading-normal" href="#pagamentos">Pagamentos</a>
               <a className="text-[#111418] text-sm font-medium leading-normal" href="#disponibilidade">Disponibilidade</a>
              <a className="text-[#111418] text-sm font-medium leading-normal" href="#chat">Chat</a>
            </div>
             <Avatar className="size-10">
                <AvatarImage src={client.avatar_url || ''} alt={displayName} />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight min-w-72">Bem-vindo(a), {displayName.split(' ')[0]}</p>
            </div>
            
            <h2 id="prestador" className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Detalhes da Assistente</h2>
            <div className="p-4">
              <div className="flex items-stretch justify-between gap-4 rounded-lg bg-white p-4 shadow-[0_0_4px_rgba(0,0,0,0.1)]">
                <div className="flex flex-[2_2_0px] flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[#111418] text-base font-bold leading-tight">Assistente: {providerName}</p>
                    <p className="text-[#60758a] text-sm font-normal leading-normal">Sua assistente dedicada para todas as suas necessidades.</p>
                  </div>
                   <Button asChild variant="outline" className="w-fit">
                        <Link href={`/assistente/${provider?.slug}`}>
                            Ver Perfil Público <ArrowUpRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                </div>
                 <Avatar className="w-full rounded-lg flex-1 h-auto aspect-video">
                    <AvatarImage src={provider?.avatar_url || ''} alt={providerName} className="object-cover"/>
                    <AvatarFallback>{providerName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
            </div>

            <h2 id="proposta" className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Proposta de Serviço</h2>
            <div className="p-4 grid grid-cols-[25%_1fr] gap-x-6">
              {activeProposal ? (
                <>
                 <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbe0e6] py-5">
                    <p className="text-[#60758a] text-sm font-normal leading-normal">Serviços</p>
                    <p className="text-[#111418] text-sm font-normal leading-normal">{activeProposal.services.join(', ')}</p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbe0e6] py-5">
                    <p className="text-[#60758a] text-sm font-normal leading-normal">Valores</p>
                    <p className="text-[#111418] text-sm font-normal leading-normal">R$ {Number(activeProposal.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {activeProposal.payment_type === 'fixed' ? 'mês' : activeProposal.payment_type}</p>
                </div>
                 <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbe0e6] py-5">
                    <p className="text-[#60758a] text-sm font-normal leading-normal">Vencimento</p>
                    <p className="text-[#111418] text-sm font-normal leading-normal">Todo dia {activeProposal.payment_day}</p>
                </div>
                </>
              ) : (
                 <p className="col-span-2 text-sm text-muted-foreground border-t border-t-[#dbe0e6] py-5">Nenhuma proposta ativa vinculada a um contrato.</p>
              )}
            </div>

            <h2 id="contratos" className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Contratos</h2>
            <div className="pb-3">
              <div className="flex border-b border-[#dbe0e6] px-4 gap-8">
                 <button onClick={() => setActiveContractTab('pending')} className={cn("flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4", activeContractTab === 'pending' ? 'border-b-[#111418] text-[#111418]' : 'border-b-transparent text-[#60758a]')}>
                    <p className="text-sm font-bold leading-normal tracking-[0.015em]">Pendentes ({pendingContracts.length})</p>
                </button>
                 <button onClick={() => setActiveContractTab('contracted')} className={cn("flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4", activeContractTab === 'contracted' ? 'border-b-[#111418] text-[#111418]' : 'border-b-transparent text-[#60758a]')}>
                    <p className="text-sm font-bold leading-normal tracking-[0.015em]">Contratados ({contractedContracts.length})</p>
                </button>
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="flex overflow-hidden rounded-lg border border-[#dbe0e6] bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white hover:bg-white">
                      <TableHead className="w-[400px]">Nome do Contrato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(activeContractTab === 'pending' ? pendingContracts : contractedContracts).map(contract => {
                      const status = getContractStatusInfo(contract.status);
                      return (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">{contract.propostas?.name || 'Contrato de Serviço'}</TableCell>
                          <TableCell><Badge variant="outline" className={cn("font-normal", status.className)}>{status.text}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="link" className="text-primary p-0 h-auto">
                              <Link href={`/portal/${client.id}/contrato/${contract.id}`}>Visualizar</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                     {(activeContractTab === 'pending' && pendingContracts.length === 0) && (
                        <TableRow><TableCell colSpan={3} className="text-center h-24">Nenhum contrato pendente.</TableCell></TableRow>
                     )}
                     {(activeContractTab === 'contracted' && contractedContracts.length === 0) && (
                        <TableRow><TableCell colSpan={3} className="text-center h-24">Nenhum contrato assinado.</TableCell></TableRow>
                     )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <h2 id="pagamentos" className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Faturas e Recibos</h2>
            <div className="px-4 py-3">
              <div className="flex overflow-hidden rounded-lg border border-[#dbe0e6] bg-white">
                 <Table>
                  <TableHeader>
                    <TableRow className="bg-white hover:bg-white">
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charges.length > 0 ? charges.map(charge => {
                        const status = getStatusInfo(charge.status, charge.due_date);
                        const isInvoiceAvailable = charge.status === 'pago' && !!charge.invoice_url;
                        return (
                         <TableRow key={charge.id}>
                            <TableCell>{isClientSide ? format(new Date(charge.due_date), 'dd/MM/yyyy') : ''}</TableCell>
                            <TableCell>R$ {Number(charge.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell><Badge variant="outline" className={cn("font-normal w-24 justify-center", status.className)}>{status.text}</Badge></TableCell>
                            <TableCell className="text-right space-x-2">
                               {isInvoiceAvailable ? (
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadClick(charge)}>Nota Fiscal</Button>
                               ) : (
                                    <Button variant="outline" size="sm" disabled>Nota Fiscal</Button>
                               )}
                               {charge.status !== 'pago' && (
                                    <Button size="sm" onClick={() => setSelectedCharge(charge)}>Pagar Agora</Button>
                               )}
                            </TableCell>
                        </TableRow>
                        )
                    }) : (
                        <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhuma cobrança encontrada.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <h2 id="disponibilidade" className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Disponibilidade da Assistente</h2>
            <div className="p-4">
              <Card className="shadow-[0_0_4px_rgba(0,0,0,0.1)]">
                <CardContent className="p-4">
                  {provider && <PortalCalendar providerId={provider.id} />}
                </CardContent>
              </Card>
            </div>

            <h2 id="chat" className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Chat</h2>
            <div className="px-4">
              <ChatInterface clientId={clientId} isUser={false} />
            </div>

            <div className="flex justify-end overflow-hidden px-5 pb-5 fixed bottom-5 right-5 z-20">
              <Button onClick={() => setIsChatOpen(true)} className="rounded-full h-14 w-14 p-0 shadow-lg">
                <MessageSquare className="h-6 w-6"/>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

     {isChatOpen && (
        <div className="fixed bottom-24 right-5 z-50 w-80 h-[500px] shadow-2xl rounded-xl bg-white">
            <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                    <CardContent className="flex items-center gap-2 p-0">
                        <MessageSquare className="h-5 w-5"/>
                        <p className="font-semibold">Fale com {providerName}</p>
                    </CardContent>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsChatOpen(false)}><X className="h-4 w-4"/></Button>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <ChatInterface clientId={clientId} isUser={false} />
                </CardContent>
            </Card>
        </div>
     )}

    <AlertDialog open={!!selectedCharge} onOpenChange={() => setSelectedCharge(null)}>
        <AlertDialogContent>
            <AlertDialogHeader className="space-y-4">
                <AlertDialogTitle className="text-center">Realizar Pagamento</AlertDialogTitle>
                <AlertDialogDescription asChild>
                    {provider && selectedCharge ? (
                        <StaticPixQRCode provider={provider} charge={selectedCharge} />
                    ) : (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Instruções de Pagamento</AlertTitle>
                            <AlertDescription>
                                Não foi possível gerar o QR Code. Por favor, entre em contato com <strong>{provider?.full_name || 'a contratada'}</strong> pelo e-mail <strong>{provider?.email || '[e-mail não disponível]'}</strong> para receber a chave PIX e realizar o pagamento.
                            </AlertDescription>
                        </Alert>
                    )}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Fechar</AlertDialogCancel>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
