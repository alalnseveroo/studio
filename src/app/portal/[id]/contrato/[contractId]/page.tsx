'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, notFound } from 'next/navigation'
import { getContractForClientById, signContractAsClient } from '@/lib/actions/contratos'
import { sendClientSignatureOtp } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import type { Contrato } from '@/lib/types'
import { Loader2, ArrowLeft, UserCheck, ShieldCheck, Download, Edit, Send, Info, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { format } from 'date-fns'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import SignatureCanvas from 'react-signature-canvas'
import html2pdf from 'html2pdf.js'

type SheetStep = 'initial' | 'otp_sent' | 'verifying'

export default function ContratoPortalPage() {
  const params = useParams()
  const clientId = params.id as string
  const contractId = params.contractId as string

  const [contract, setContract] = useState<Contrato | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetStep, setSheetStep] = useState<SheetStep>('initial')
  const [otp, setOtp] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const sigCanvas = useRef<SignatureCanvas>(null)
  const { toast } = useToast()

  const fetchContract = useCallback(async () => {
    if (!contractId || !clientId) return
    setIsLoading(true)
    const { data, error } = await getContractForClientById(contractId)
    if (error || !data || data.cliente_id !== clientId) {
      setContract(null)
      notFound()
    } else {
      setContract(data)
    }
    setIsLoading(false)
  }, [contractId, clientId])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  const handleOpenSignatureSheet = () => {
    if (contract?.clientes.email) {
      setIsSheetOpen(true)
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: 'O e-mail do cliente não está configurado para enviar o código de assinatura.' })
    }
  }

  const handleSendOtp = async () => {
    const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
    if (!signatureData || sigCanvas.current?.isEmpty()) {
      toast({ variant: 'destructive', title: 'Assinatura Faltando', description: 'Por favor, desenhe sua assinatura.' })
      return
    }
    setSignature(signatureData)
    setSheetStep('verifying')
    
    const { success, error } = await sendClientSignatureOtp(contract!.id)
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Enviar Código', description: error.message })
      setSheetStep('initial')
    } else if (success) {
      toast({ title: 'Código Enviado!', description: `Enviamos um código para o e-mail cadastrado.` })
      setSheetStep('otp_sent')
    }
  }

  const handleVerifyAndSign = async () => {
    if (otp.length < 6 || !signature) {
      toast({ variant: 'destructive', title: 'Dados Inválidos', description: 'O código deve ter 6 dígitos e a assinatura deve ser fornecida.' })
      return
    }
    setSheetStep('verifying')
    
    const { error } = await signContractAsClient({ contractId: contract!.id, otp, signatureDataUrl: signature })
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Assinar', description: error.message })
      setSheetStep('otp_sent')
      setOtp('')
    } else {
      toast({
        title: 'Contrato Assinado!',
        description: 'Sua assinatura foi registrada com sucesso.',
        className: 'bg-green-100 border-green-200 text-green-800'
      })
      await fetchContract()
      resetSheet()
    }
  }

  const resetSheet = () => {
    setIsSheetOpen(false)
    setTimeout(() => {
      setSheetStep('initial')
      setOtp('')
      setSignature(null)
      sigCanvas.current?.clear()
    }, 300)
  }

  const handleDownloadPdf = () => {
    const element = document.getElementById('contract-content-for-pdf');
    if (element) {
        const opt = {
            margin:       1,
            filename:     `Contrato_${contract?.contract_code}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    }
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!contract) {
    return notFound()
  }

  const isSignedByProvider = !!contract.provider_signature_data
  const isSignedByClient = !!contract.client_signature_data

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho'
      case 'signed_by_provider': return 'Aguardando sua Assinatura'
      case 'signed_by_client': return 'Finalizado'
      default: return 'Desconhecido'
    }
  }

  return (
    <>
      <div className="flex min-h-screen w-full justify-center bg-muted/40 px-4 py-8 md:py-16">
        <main className="w-full max-w-4xl space-y-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href={`/portal/${clientId}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <h1 className="flex-1 text-2xl font-bold">Contrato {contract.contract_code}</h1>
            <div className="flex items-center gap-2">
                {isSignedByClient && (
                    <Button onClick={handleDownloadPdf}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar PDF
                    </Button>
                )}
                {isSignedByProvider && !isSignedByClient && (
                    <Button onClick={handleOpenSignatureSheet}>
                        <Edit className="mr-2 h-4 w-4" />
                        Assinar Contrato
                    </Button>
                )}
            </div>
          </div>

          {isSignedByClient && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Assinado por Você!</AlertTitle>
              <AlertDescription className="text-green-700">
                Este contrato foi finalizado e assinado por você em {format(new Date(contract.client_signature_data!.signed_at), 'dd/MM/yyyy HH:mm:ss')}.
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
              <CardDescription>Status: {getStatusText(contract.status)}</CardDescription>
            </CardHeader>
            <CardContent id="contract-content-for-pdf">
              <div
                className="prose prose-sm max-w-none rounded-md border bg-gray-50 p-6"
                dangerouslySetInnerHTML={{ __html: contract.full_contract_text || '' }}
              />
            </CardContent>
          </Card>
        </main>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={resetSheet}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Confirmar Assinatura Digital</SheetTitle>
            <SheetDescription>
              Para sua segurança, desenhe sua assinatura e confirme com o código que enviaremos para seu e-mail.
            </SheetDescription>
          </SheetHeader>

          {sheetStep === 'initial' && (
             <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Desenhe sua assinatura</label>
                    <div className="w-full h-48 rounded-md border border-input bg-background">
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor='black'
                            canvasProps={{className: 'w-full h-full'}}
                        />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => sigCanvas.current?.clear()} className="mt-2">
                        Limpar
                    </Button>
                </div>
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Termos de Assinatura</AlertTitle>
                    <AlertDescription>
                      <ul className="list-inside list-disc space-y-2 py-2 text-xs">
                        <li>Você confirma que leu e concorda com todos os termos deste contrato.</li>
                        <li>Sua assinatura será registrada com seu endereço de IP, data e hora.</li>
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
                        Enviamos um código de 6 dígitos para <strong>{contract?.clientes.email}</strong>. Por favor, insira-o abaixo.
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
                    <Send className="mr-2 h-4 w-4" />
                    Confirmar e Enviar Código
                </Button>
            )}
             {sheetStep === 'otp_sent' && (
                <Button onClick={handleVerifyAndSign}>
                  Verificar e Assinar
                </Button>
            )}
            {sheetStep === 'verifying' && (
                <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
