'use server'

import { getContractForClientById } from '@/lib/actions/contratos'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UserCheck, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface ContratoPortalProps {
  params: {
    id: string; // client ID
    contractId: string;
  }
}

export default async function ContratoPortalPage({ params }: ContratoPortalProps) {
  const { data: contract, error } = await getContractForClientById(params.contractId)

  if (error || !contract || contract.cliente_id !== params.id) {
    notFound()
  }

  const isSignedByProvider = !!contract.provider_signature_data;
  const isSignedByClient = !!contract.client_signature_data;
  
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

  return (
     <div className="flex min-h-screen w-full justify-center bg-muted/40 px-4 py-8 md:py-16">
      <main className="w-full max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
                <Link href={`/portal/${params.id}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
                </Link>
            </Button>
            <h1 className="flex-1 text-2xl font-bold">
                Contrato {contract.contract_code}
            </h1>
        </div>

        {isSignedByClient && contract.client_signature_data && (
             <Alert variant="default" className="bg-green-50 border-green-200">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Assinado por Você!</AlertTitle>
                <AlertDescription className="text-green-700">
                    Este contrato foi assinado por você em {format(new Date(contract.client_signature_data.signed_at), 'dd/MM/yyyy HH:mm:ss')}.
                </AlertDescription>
            </Alert>
        )}
        
         {isSignedByProvider && !isSignedByClient && (
            <Alert>
                <UserCheck className="h-4 w-4" />
                <AlertTitle>Pronto para Assinar</AlertTitle>
                <AlertDescription>
                    Este contrato já foi assinado pela contratada e está aguardando a sua assinatura para ser finalizado.
                </AlertDescription>
            </Alert>
        )}


        <Card>
            <CardHeader>
                <CardTitle>Detalhes do Contrato</CardTitle>
                <CardDescription>
                   Status: {getStatusText(contract.status)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div 
                    className="prose prose-sm max-w-none rounded-md border bg-gray-50 p-6"
                    dangerouslySetInnerHTML={{ __html: contract.full_contract_text || '' }}
                />
            </CardContent>
        </Card>
      </main>
    </div>
  )
}