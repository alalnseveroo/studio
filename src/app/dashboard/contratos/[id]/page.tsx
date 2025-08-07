'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getContractById, signContractAsProvider } from '@/lib/actions/contratos'
import { useToast } from '@/hooks/use-toast'
import type { Contrato } from '@/lib/types'
import { Loader2, ArrowLeft, FileText, CheckCircle, Info, ChevronRight, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'

export default function ContratoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string
  
  const [contract, setContract] = useState<Contrato | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  
  const { toast } = useToast()

  const fetchContract = useCallback(async () => {
    if (!contractId) return
    setIsLoading(true)
    const { data, error } = await getContractById(contractId)
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Carregar Contrato',
        description: error.message,
      })
    } else {
      setContract(data)
    }
    setIsLoading(false)
  }, [contractId, toast])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  const handleSignContract = async () => {
    setIsSigning(true)
    const { data, error } = await signContractAsProvider(contractId)
    setIsSigning(false)
    setIsSheetOpen(false)

    if (error) {
       toast({
        variant: 'destructive',
        title: 'Erro ao Assinar',
        description: error.message,
      })
    } else {
      toast({
        title: 'Contrato Assinado!',
        description: 'Sua assinatura foi registrada. Aguardando assinatura do cliente.',
      })
      fetchContract() // Re-fetch contract to update status
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!contract) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
                Contrato não encontrado
            </h3>
        </div>
      </div>
    )
  }
  
  const isSignedByProvider = contract.status === 'signed_by_provider' || contract.status === 'signed_by_client';

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 rounded-lg bg-card p-4 shadow-sm sm:gap-6 sm:p-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="h-7 w-7">
              <Link href="/dashboard/contratos">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
              </Link>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Contrato {contract.contract_code}
          </h1>
          <Badge variant="outline" className="ml-auto sm:ml-0">
            {contract.status === 'draft' ? 'Rascunho' : contract.status === 'signed_by_provider' ? 'Aguardando Cliente' : 'Assinado'}
          </Badge>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
             {!isSignedByProvider && (
              <Button onClick={() => setIsSheetOpen(true)}>Assinar Contrato</Button>
            )}
             {isSignedByProvider && (
              <Button variant="secondary" disabled>Assinado</Button>
            )}
          </div>
        </div>
        
        {isSignedByProvider && contract.provider_signature_data && (
            <Alert variant="default" className="bg-green-50 border-green-200">
                <UserCheck className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Assinado por Você!</AlertTitle>
                <AlertDescription className="text-green-700">
                    Este contrato foi assinado por você em {format(new Date(contract.provider_signature_data.signed_at), 'dd/MM/yyyy HH:mm:ss')}.
                </AlertDescription>
            </Alert>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Detalhes do Contrato</CardTitle>
                <CardDescription>
                    Gerado em {format(new Date(contract.created_at), 'dd/MM/yyyy')}. 
                    Cliente: {contract.clientes.full_name || contract.clientes.company_name}. 
                    Proposta: {contract.propostas.name}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div 
                    className="prose prose-sm max-w-none rounded-md border bg-gray-50 p-6 whitespace-pre-wrap font-mono"
                    dangerouslySetInnerHTML={{ __html: contract.full_contract_text || '' }}
                />
            </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Confirmar Assinatura Digital</SheetTitle>
            <SheetDescription>
              Leia os termos abaixo antes de prosseguir. Sua assinatura digital tem validade jurídica.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Termos de Assinatura</AlertTitle>
                <AlertDescription>
                  <ul className="list-inside list-disc space-y-2 py-2">
                    <li>Você confirma que leu e concorda com todos os termos deste contrato.</li>
                    <li>Sua assinatura será registrada com seu endereço de IP, data e hora.</li>
                    <li>Este ato é equivalente a uma assinatura manuscrita para todos os fins legais.</li>
                  </ul>
                </AlertDescription>
            </Alert>
             <Separator />
             <div className="font-medium">
                <p><strong>Contrato:</strong> {contract.contract_code}</p>
                <p><strong>Cliente:</strong> {contract.clientes.full_name || contract.clientes.company_name}</p>
             </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancelar</Button>
            <Button onClick={handleSignContract} disabled={isSigning}>
              {isSigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Concordar e Assinar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}