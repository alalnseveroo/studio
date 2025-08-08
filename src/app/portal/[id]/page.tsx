
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getClientById } from '@/lib/actions/clients'
import { getContractsForClientPortal } from '@/lib/actions/contratos'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { AlertCircle, User, FileText, Check, Clock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Cliente, Contrato } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

export default function ClientPortalPage() {
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<Cliente | null>(null)
  const [contracts, setContracts] = useState<Contrato[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!clientId) return
    setIsLoading(true)
    setError(null)
    const [clientResult, contractsResult] = await Promise.all([
      getClientById(clientId),
      getContractsForClientPortal(clientId),
    ])

    if (clientResult.error || !clientResult.data) {
      setError('Não foi possível carregar os dados do cliente.')
    } else {
      setClient(clientResult.data)
    }

    if (contractsResult.error) {
       setError('Não foi possível carregar os contratos.')
    } else {
      setContracts(contractsResult.data || [])
    }
    setIsLoading(false)
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
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'signed_by_provider':
        return 'outline'
      case 'signed_by_client':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho'
      case 'signed_by_provider':
        return 'Aguardando sua Assinatura'
      case 'signed_by_client':
        return 'Finalizado'
      default:
        return 'Desconhecido'
    }
  }
  
  const getStatusIcon = (status: string) => {
     switch (status) {
      case 'signed_by_provider':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'signed_by_client':
        return <Check className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="flex min-h-screen w-full justify-center bg-background px-4 py-8 md:py-16">
      <main className="w-full max-w-2xl space-y-8">
        <Card className="animate-in fade-in-50 duration-500">
          <CardHeader>
             <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={client.avatar_url || undefined} alt={`Avatar de ${displayName}`} />
                <AvatarFallback className="text-4xl">
                    {fallbackLetter}
                </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl font-bold">
                    Bem-vindo(a), {displayName}!
                    </CardTitle>
                    <CardDescription>
                        Este é seu portal seguro para visualizar e gerenciar seus contratos.
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
        </Card>

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
      </main>
    </div>
  )
}
