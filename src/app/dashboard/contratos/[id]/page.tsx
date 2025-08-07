'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getContractById, signContractAsProvider } from '@/lib/actions/contratos'
import { sendSignatureOtp } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import type { Contrato } from '@/lib/types'
import { Loader2, ArrowLeft, UserCheck, Info, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'


type SheetStep = 'initial' | 'otp_sent' | 'verifying' | 'signed'

export default function ContratoDetailPage() {
  const params = useParams()
  const contractId = params.id as string
  
  const [contract, setContract] = useState<Contrato | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetStep, setSheetStep] = useState<SheetStep>('initial')
  const [otp, setOtp] = useState('')
  const [userEmail, setUserEmail] = useState('')

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

  const handleSendOtp = async () => {
      setSheetStep('verifying'); // Show loading state
      const { success, error, email } = await sendSignatureOtp();
      if (error) {
          toast({ variant: 'destructive', title: 'Erro ao Enviar Código', description: error.message });
          setSheetStep('initial');
      } else if (success && email) {
          toast({ title: 'Código Enviado!', description: `Enviamos um código para ${email}.` });
          setUserEmail(email);
          setSheetStep('otp_sent');
      }
  }

  const handleSignContract = async () => {
    if (otp.length < 6) {
        toast({ variant: 'destructive', title: 'Código Inválido', description: 'O código deve ter 6 dígitos.' });
        return;
    }
    setSheetStep('verifying');
    const { error } = await signContractAsProvider(contractId, otp)

    if (error) {
       toast({
        variant: 'destructive',
        title: 'Erro ao Assinar',
        description: error.message,
      })
      setSheetStep('otp_sent'); // Go back to OTP input
      setOtp('');
    } else {
      toast({
        title: 'Contrato Assinado!',
        description: 'Sua assinatura foi registrada com sucesso.',
        className: 'bg-green-100 border-green-200 text-green-800'
      })
      fetchContract() // Re-fetch contract to update status
      setIsSheetOpen(false)
    }
  }
  
  const resetSheet = () => {
    setIsSheetOpen(false)
    setTimeout(() => {
        setSheetStep('initial')
        setOtp('')
        setUserEmail('')
    }, 300);
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
  
  const isSignedByProvider = !!contract.provider_signature_data;
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho'
      case 'signed_by_provider':
        return 'Aguardando Cliente'
      case 'signed_by_client':
        return 'Assinado por Todos'
      default:
        return 'Desconhecido'
    }
  }

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
            {getStatusText(contract.status)}
          </Badge>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
             {!isSignedByProvider && (
              <Button onClick={() => setIsSheetOpen(true)}>Assinar Contrato</Button>
            )}
             {isSignedByProvider && (
              <Button variant="secondary" disabled>Assinado por Você</Button>
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
                    className="prose prose-sm max-w-none rounded-md border bg-gray-50 p-6"
                    dangerouslySetInnerHTML={{ __html: contract.full_contract_text || '' }}
                />
            </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={resetSheet}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Confirmar Assinatura Digital</SheetTitle>
            <SheetDescription>
              Para sua segurança, precisamos validar sua identidade antes de assinar.
            </SheetDescription>
          </SheetHeader>

          {sheetStep === 'initial' && (
             <div className="grid gap-4 py-4">
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Termos de Assinatura</AlertTitle>
                    <AlertDescription>
                      <ul className="list-inside list-disc space-y-2 py-2">
                        <li>Você confirma que leu e concorda com todos os termos deste contrato.</li>
                        <li>Sua assinatura será registrada com seu endereço de IP, data e hora.</li>
                        <li>Um código de verificação será enviado para seu e-mail cadastrado.</li>
                      </ul>
                    </AlertDescription>
                </Alert>
             </div>
          )}

           {sheetStep === 'otp_sent' && (
             <div className="grid gap-6 py-4">
                 <Alert variant="default" className="bg-blue-50 border-blue-200">
                    <MailCheck className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Verifique seu E-mail</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        Enviamos um código de 6 dígitos para <strong>{userEmail}</strong>. Por favor, insira-o abaixo.
                    </AlertDescription>
                </Alert>
                <div className="flex flex-col items-center justify-center gap-2">
                    <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPGroup>
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                     <Button variant="link" size="sm" className="text-xs" onClick={handleSendOtp}>
                        Não recebeu? Reenviar código
                    </Button>
                </div>
             </div>
          )}

          <SheetFooter>
            <Button variant="outline" onClick={resetSheet}>Cancelar</Button>
            {sheetStep === 'initial' && (
                 <Button onClick={handleSendOtp}>
                    Enviar Código de Verificação
                </Button>
            )}
             {sheetStep === 'otp_sent' && (
                <Button onClick={handleSignContract}>
                  Verificar e Assinar
                </Button>
            )}
            {sheetStep === 'verifying' && (
                <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
