
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getClientById } from '@/lib/actions/clients'
import { getContractsForClientPortal } from '@/lib/actions/contratos'
import { getChargesForClientPortal } from '@/lib/actions/cobrancas'
import { getProfile } from '@/lib/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, User, FileText, Check, Clock, Verified, Briefcase, Mail, Download, CreditCard } from 'lucide-react'
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
import Link from 'next/link'
import type { Cliente, Contrato, Profile, Cobranca } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import PixQRCode from '@/components/pix-qrcode'
import { format, isPast } from 'date-fns'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'


interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  isVerified?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value, isVerified }) => (
  <div className="flex items-start gap-4">
    <Icon className="h-5 w-5 text-primary mt-1" />
    <div className="flex-1">
      <p className="text-sm font-semibold">{label}</p>
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        {value}
        {isVerified && <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-700 font-normal text-xs px-1.5 py-0">Verificado</Badge>}
      </div>
    </div>
  </div>
);


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
  
  const getStatusInfo = (status: string, dueDate: string) => {
    if (status === 'pago') {
      return { text: 'Pago', className: 'border-green-500 bg-green-500/10 text-green-700' };
    }
    if (isPast(new Date(dueDate))) {
      return { text: 'Atrasado', className: 'border-red-500 bg-red-500/10 text-red-700' };
    }
    return { text: 'Pendente', className: 'border-yellow-500 bg-yellow-500/10 text-yellow-700' };
  }

  const fetchData = useCallback(async () => {
    if (!clientId) return
    setIsLoading(true)
    setError(null)
    
    try {
        const { data: clientData, error: clientError } = await getClientById(clientId);
        if (clientError || !clientData) {
            throw new Error('Não foi possível carregar os dados do cliente.');
        }
        setClient(clientData);

        if (clientData.user_id) {
            const { data: providerData, error: providerError } = await getProfile(clientData.user_id);
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
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><p>Carregando...</p></div>
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

  const displayName = client.full_name || client.company_name || 'Cliente'
  const fallbackLetter = displayName.charAt(0).toUpperCase()
  const providerName = provider?.full_name || provider?.company_name || 'Assistente Virtual'
  const providerFallbackLetter = providerName.charAt(0).toUpperCase();


  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'signed_by_provider': return 'outline'
      case 'signed_by_client': return 'default'
      default: return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho'
      case 'signed_by_provider': return 'Aguardando sua Assinatura'
      case 'signed_by_client': return 'Finalizado'
      default: return 'Desconhecido'
    }
  }
  
  const getStatusIcon = (status: string) => {
     switch (status) {
      case 'signed_by_provider': return <Clock className="h-4 w-4 text-orange-500" />
      case 'signed_by_client': return <Check className="h-4 w-4 text-green-500" />
      default: return <FileText className="h-4 w-4" />
    }
  }
  
  const getOverallStatus = () => {
    const hasPending = contracts.some(c => c.status === 'signed_by_provider');
    if (hasPending) {
        return <Badge variant="outline" className="border-orange-500 bg-orange-500/10 text-orange-700">Pendente de assinatura</Badge>;
    }
     const allSigned = contracts.every(c => c.status === 'signed_by_client');
    if (contracts.length > 0 && allSigned) {
        return <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-700">Ativo</Badge>;
    }
    return <Badge variant="secondary">Nenhum contrato ativo</Badge>;
  }


  return (
    <>
    <div className="relative min-h-screen w-full bg-background">
      <div className="absolute left-[60px] top-[60px] flex items-end gap-4">
        <div className="relative">
            <Avatar className="h-40 w-40 border-4 border-background shadow-md">
                <AvatarImage src={client.avatar_url || undefined} alt={`Avatar de ${displayName}`} />
                <AvatarFallback className="text-6xl">
                    {fallbackLetter}
                </AvatarFallback>
            </Avatar>
            {provider && (
              <Avatar className="absolute bottom-0 right-0 h-16 w-16 border-4 border-background">
                 <AvatarImage src={undefined} alt={`Avatar de ${providerName}`} />
                 <AvatarFallback>{providerFallbackLetter}</AvatarFallback>
              </Avatar>
            )}
        </div>
        <div className="space-y-1 pb-2">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-muted-foreground">Em parceria com {providerName}</p>
        </div>
      </div>

      <main className="w-full max-w-4xl space-y-6 px-4 pb-8 pt-48 md:pl-[60px] md:pt-64">
        <Tabs defaultValue="dados" className="w-full">
            <TabsList>
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="proposta">Proposta</TabsTrigger>
                <TabsTrigger value="contratos">Contratos</TabsTrigger>
                <TabsTrigger value="pagamentos">Pagamentos e notas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dados" className="mt-6 space-y-6">
                <h2 className="text-xl font-bold">Dados Gerais</h2>
                <div className="space-y-6">
                    <InfoRow icon={Briefcase} label="Assistente Virtual" value={providerName} />
                    <InfoRow icon={Mail} label="E-mail" value={provider?.email || 'Não informado'} isVerified={!!provider?.email} />
                    <InfoRow icon={User} label="CNPJ / CPF" value={provider?.cnpj || provider?.cpf || 'Não informado'} />
                    <Separator />
                    <InfoRow icon={FileText} label="Status" value={getOverallStatus()} />
                    <InfoRow 
                        icon={Check} 
                        label="Objetivo" 
                        value={contracts.length > 0 ? (contracts[0].propostas?.name || 'Serviços de Assistência Virtual') : 'Nenhum contrato ativo'} 
                    />
                </div>
            </TabsContent>
            
            <TabsContent value="proposta" className="mt-6 space-y-6">
                 <h2 className="text-xl font-bold">Proposta</h2>
                 <p className="text-sm text-muted-foreground">Detalhes da proposta de serviço serão exibidos aqui.</p>
            </TabsContent>

            <TabsContent value="contratos" className="mt-6 space-y-6">
                <h2 className="text-xl font-bold">Meus Contratos</h2>
                {contracts.length === 0 ? (
                    <Alert variant="default">
                        <FileText className="h-4 w-4" />
                        <AlertTitle>Nenhum Contrato</AlertTitle>
                        <AlertDescription>
                           Você ainda não possui contratos disponíveis para visualização.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        {contracts.map(contract => (
                             <Card key={contract.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                    {getStatusIcon(contract.status)}
                                    <div>
                                        <p className="font-semibold">Contrato {contract.contract_code}</p>
                                        <Badge variant={getStatusVariant(contract.status) as any} className="mt-1">
                                          {getStatusText(contract.status)}
                                        </Badge>
                                    </div>
                                </div>
                                <Button asChild variant="outline" size="sm" className="mt-4 sm:mt-0 w-full sm:w-auto">
                                    <Link href={`/portal/${client.id}/contrato/${contract.id}`}>
                                        Visualizar
                                    </Link>
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>
            
             <TabsContent value="pagamentos" className="mt-6 space-y-6">
                <h2 className="text-xl font-bold">Pagamentos e Notas Fiscais</h2>
                 {charges.length > 0 ? (
                     <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {charges.map(charge => {
                                        const status = getStatusInfo(charge.status, charge.due_date);
                                        return (
                                        <TableRow key={charge.id}>
                                            <TableCell>{format(new Date(charge.due_date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>R$ {Number(charge.value).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("font-normal", status.className)}>{status.text}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                 <Button variant="outline" size="sm" disabled>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Nota Fiscal
                                                 </Button>
                                                {charge.status === 'pendente' && (
                                                    <Button size="sm" onClick={() => setSelectedCharge(charge)}>
                                                         <CreditCard className="mr-2 h-4 w-4" />
                                                         Pagar com PIX
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </CardContent>
                     </Card>
                ) : (
                    <Alert variant="default">
                        <FileText className="h-4 w-4" />
                        <AlertTitle>Nenhuma Cobrança</AlertTitle>
                        <AlertDescription>
                           Ainda não há cobranças geradas para este contrato.
                        </AlertDescription>
                    </Alert>
                )}
            </TabsContent>
        </Tabs>
      </main>
    </div>
    
     <AlertDialog open={!!selectedCharge} onOpenChange={() => setSelectedCharge(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Pagamento via PIX</AlertDialogTitle>
            <AlertDialogDescription>
                Use o QR Code ou a chave "Copia e Cola" para realizar o pagamento no app do seu banco.
            </AlertDialogDescription>
            </AlertDialogHeader>
                {provider && selectedCharge && (
                    <PixQRCode
                        pixKey={provider.cpf || provider.cnpj || ''}
                        value={selectedCharge.value || 0}
                        beneficiaryName={provider.full_name || provider.company_name || 'Beneficiário'}
                        beneficiaryCity={provider.address?.split(',').slice(-2, -1)[0]?.trim() || 'CIDADE'}
                    />
                )}
            <AlertDialogFooter>
                <AlertDialogCancel>Fechar</AlertDialogCancel>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
