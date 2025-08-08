

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getClientById } from '@/lib/actions/clients'
import { getContractsForClientPortal } from '@/lib/actions/contratos'
import { getProfile } from '@/lib/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { AlertCircle, User, FileText, Check, Clock, Verified, Briefcase, Mail } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Cliente, Contrato, Profile } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator'


interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  isVerified?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value, isVerified }) => (
  <div className="flex items-start gap-4">
    <Icon className="h-5 w-5 text-muted-foreground mt-1" />
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        const { data: contractsData, error: contractsError } = await getContractsForClientPortal(clientId)
        if (contractsError) {
          console.error('Could not fetch contracts for portal', contractsError)
        }
        setContracts(contractsData || []);
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
    <div className="relative min-h-screen w-full bg-background">
        <div className="absolute left-[60px] top-[60px]">
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

      <main className="w-full max-w-2xl space-y-6 px-4 pb-8 pt-48 md:mx-auto md:pt-56">
        <div className="space-y-1">
             <h1 className="text-2xl font-bold">{displayName}</h1>
             <p className="text-muted-foreground">Em parceria com {providerName}</p>
        </div>

        <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="proposta">Proposta</TabsTrigger>
                <TabsTrigger value="contratos">Contratos</TabsTrigger>
                <TabsTrigger value="pagamentos">Pagamentos e notas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dados">
                <Card>
                    <CardHeader>
                        <CardTitle>Dados Gerais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <InfoRow icon={Briefcase} label="Assistente Virtual" value={providerName} />
                        <InfoRow icon={Mail} label="E-mail" value={provider?.email || 'Não informado'} isVerified={!!provider?.email} />
                        <InfoRow icon={User} label="CNPJ / CPF" value={provider?.cnpj || provider?.cpf || 'Não informado'} />
                        <Separator />
                        <InfoRow icon={FileText} label="Status" value={getOverallStatus()} />
                         <InfoRow 
                          label="Objetivo" 
                          icon={Check} 
                          value={contracts.length > 0 ? (contracts[0].propostas?.name || 'Serviços de Assistência Virtual') : 'Nenhum contrato ativo'} 
                        />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="proposta">
                 <Card>
                    <CardHeader><CardTitle>Proposta</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Detalhes da proposta de serviço serão exibidos aqui.</p>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="contratos">
                <Card>
                    <CardHeader>
                        <CardTitle>Meus Contratos</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
            </TabsContent>
            
             <TabsContent value="pagamentos">
                 <Card>
                    <CardHeader><CardTitle>Pagamentos e Notas</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Informações sobre pagamentos e notas fiscais serão exibidas aqui.</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
