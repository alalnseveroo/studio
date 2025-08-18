
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, notFound } from 'next/navigation'
import { getContractForClientById, signContractAsClient } from '@/lib/actions/contratos'
import { getProfile } from '@/lib/actions/profile'
import { sendClientVerificationCode } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import type { Contrato, Profile, Cobranca } from '@/lib/types'
import { Loader2, ArrowLeft, UserCheck, ShieldCheck, Download, Edit, Send, Info, MailCheck, FileText, Lock, CreditCard, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { format } from 'date-fns'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import SignatureCanvas from 'react-signature-canvas'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { StaticPixQRCode } from '@/components/static-pix-qrcode'


type StepId = 'review' | 'sign' | 'payment';
type OtpStep = 'initial' | 'otp_sent' | 'verifying' | 'signed';

export default function ContratoPortalPage() {
  const params = useParams()
  const clientId = params.id as string
  const contractId = params.contractId as string

  const [contract, setContract] = useState<Contrato | null>(null)
  const [provider, setProvider] = useState<(Profile & {email: string}) | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<StepId>('review');
  
  const [otpStep, setOtpStep] = useState<OtpStep>('initial');
  const [otp, setOtp] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const { toast } = useToast()

  const fetchContract = useCallback(async () => {
    if (!contractId || !clientId) return
    setIsLoading(true)
    const { data, error } = await getContractForClientById(contractId)
    if (error || !data || data.cliente_id !== clientId) {
      setContract(null)
      setProvider(null)
      notFound()
    } else {
      setContract(data)
       if (data.user_id) {
        const { data: providerData, error: providerError } = await getProfile(data.user_id);
        if (providerError) {
          console.error("Could not fetch provider profile for contract portal", providerError);
           setProvider(null);
        } else {
          setProvider(providerData as Profile & { email: string });
        }
      }
      if (data.client_signature_data) {
        setActiveStep('payment'); 
      } else if (data.provider_signature_data) {
        setActiveStep('review');
      }
    }
    setIsLoading(false)
  }, [contractId, clientId])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  const handleSendCode = async () => {
    const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
    if (!signatureData || sigCanvas.current?.isEmpty()) {
      toast({ variant: 'destructive', title: 'Assinatura Faltando', description: 'Por favor, desenhe sua assinatura.' })
      return
    }
    setSignature(signatureData)
    setOtpStep('verifying')
    
    const { success, error, message } = await sendClientVerificationCode(contract!.id)
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Enviar Código', description: error.message })
      setOtpStep('initial')
    } else if (success) {
      toast({ 
        title: 'Verifique seu E-mail!', 
        description: message,
        duration: 10000 
      })
      setOtpStep('otp_sent')
    }
  }

  const handleVerifyAndSign = async () => {
    if (otp.length < 6 || !signature) {
      toast({ variant: 'destructive', title: 'Dados Inválidos', description: 'O código deve ter 6 dígitos e a assinatura deve ser fornecida.' })
      return
    }
    setOtpStep('verifying')
    
    const { data, error } = await signContractAsClient({ contractId: contract!.id, otp, signatureDataUrl: signature })
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Assinar', description: error.message })
      setOtpStep('otp_sent')
      setOtp('')
    } else {
      toast({
        title: 'Contrato Assinado!',
        description: 'Sua assinatura foi registrada com sucesso.',
        className: 'bg-green-100 border-green-200 text-green-800'
      })
      setOtpStep('signed');
      if (data) {
        setContract(data);
      }
    }
  }

  const handleDownloadPdf = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('contract-content-for-pdf');
    if (element) {
        const opt = {
            margin:       1,
            filename:     `Contrato_${contract?.contract_code}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    }
  }

  if (isLoading && !contract) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!contract) {
    return notFound()
  }

  const isSignedByProvider = !!contract.provider_signature_data
  const isSignedByClient = !!contract.client_signature_data
  const isReadyToSign = isSignedByProvider && !isSignedByClient;
  
  const isReviewComplete = isReadyToSign;
  const isSignComplete = isSignedByClient;
  const firstCharge: Cobranca | undefined = isSignComplete ? {
      id: contract.id, // Use contract ID as a unique TXID
      created_at: contract.created_at,
      user_id: contract.user_id,
      cliente_id: contract.cliente_id,
      due_date: new Date().toISOString(), // First payment is due now
      value: contract.propostas.value || 0,
      status: 'pendente',
      paid_at: null,
      invoice_url: null,
      updated_at: null,
      download_otp: null,
      download_otp_expires_at: null,
      clientes: contract.clientes,
  } : undefined;

  return (
    <>
      <div className="flex min-h-screen w-full justify-center bg-muted/40 px-4 py-8 md:py-16">
        <main className="w-full max-w-4xl space-y-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href={`/portal/${clientId}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <h1 className="flex-1 text-2xl font-bold">Contrato {contract.contract_code}</h1>
             {isSignedByClient && (
                <Button onClick={handleDownloadPdf} size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                </Button>
            )}
          </div>
          
            <Accordion type="single" value={activeStep} onValueChange={(v) => setActiveStep(v as StepId)} collapsible className="w-full space-y-4">
                <Card>
                    <AccordionItem value="review" className="border-b-0">
                        <AccordionTrigger 
                          disabled={isReviewComplete}
                          className={cn("p-6 hover:no-underline", isReviewComplete && "text-green-600")}
                        >
                            <div className="flex items-center gap-4">
                                {isReviewComplete ? <CheckCircle className="h-6 w-6 text-green-500"/> : <FileText className="h-6 w-6"/>}
                                <span className="text-lg font-semibold">Etapa 1: Revise o contrato</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 pt-0">
                            <div className="space-y-6">
                                <div
                                    id="contract-content"
                                    className="prose prose-sm max-w-none rounded-md border bg-gray-50 p-6"
                                    dangerouslySetInnerHTML={{ __html: contract.full_contract_text || '' }}
                                />
                                <div className="flex justify-end">
                                    <Button onClick={() => setActiveStep('sign')} disabled={!isReadyToSign}>
                                        {isReadyToSign ? 'Li e concordo, avançar para assinatura' : 'Aguardando assinatura da contratada'}
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
                
                <Card>
                    <AccordionItem value="sign" className="border-b-0">
                         <AccordionTrigger 
                          disabled={!isReviewComplete || isSignComplete}
                          className={cn("p-6 hover:no-underline", isSignComplete && "text-green-600")}
                        >
                            <div className="flex items-center gap-4">
                                {isSignComplete ? <CheckCircle className="h-6 w-6 text-green-500"/> : <Lock className="h-6 w-6"/>}
                                <span className="text-lg font-semibold">Etapa 2: Solicitar verificação e assinar</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 pt-0">
                           <div className="space-y-6">
                             {otpStep === 'signed' ? (
                                <>
                                    <Alert variant="default" className="bg-green-50 border-green-200">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertTitle className="text-green-800">Assinatura Verificada!</AlertTitle>
                                        <AlertDescription className="text-green-700">
                                            Sua assinatura foi validada. Veja abaixo como ela ficará no contrato e avance para finalizar.
                                        </AlertDescription>
                                    </Alert>
                                    <div
                                        className="prose prose-sm max-w-none rounded-md border bg-gray-50 p-6"
                                        dangerouslySetInnerHTML={{ __html: contract.full_contract_text || '' }}
                                    />
                                    <div className="flex justify-end">
                                        <Button onClick={() => setActiveStep('payment')}>
                                            Avançar para Pagamento
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground">Para sua segurança, desenhe sua assinatura e confirme com o código de 6 dígitos que será enviado para o seu e-mail.</p>
                                    {otpStep === 'initial' && (
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">1. Desenhe sua assinatura</label>
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
                                        </div>
                                    )}
                                    {otpStep === 'otp_sent' && (
                                        <div className="grid gap-6 py-4">
                                            <Alert variant="default" className="bg-blue-50 border-blue-200">
                                                <MailCheck className="h-4 w-4 text-blue-600" />
                                                <AlertTitle className="text-blue-800">Verifique seu E-mail</AlertTitle>
                                                <AlertDescription className="text-blue-700">
                                                    Um e-mail com um código de 6 dígitos foi enviado para você. Insira-o abaixo para validar sua assinatura.
                                                </AlertDescription>
                                            </Alert>
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <label className="text-sm font-medium">2. Insira o código de verificação</label>
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
                                            </div>
                                        </div>
                                    )}
                                    {otpStep === 'verifying' && (
                                        <div className="flex justify-center items-center py-12">
                                            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                                            <p>Processando...</p>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setActiveStep('review')}>Voltar</Button>
                                        {otpStep === 'initial' && (
                                            <Button onClick={handleSendCode}>
                                                <Send className="mr-2 h-4 w-4" />
                                                Confirmar Assinatura e Enviar Código
                                            </Button>
                                        )}
                                        {otpStep === 'otp_sent' && (
                                            <Button onClick={handleVerifyAndSign}>
                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                Verificar e Assinar Contrato
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>

                 <Card>
                    <AccordionItem value="payment" className="border-b-0">
                         <AccordionTrigger 
                          disabled={!isSignComplete}
                          className="p-6 hover:no-underline"
                        >
                            <div className="flex items-center gap-4">
                                <CreditCard className="h-6 w-6"/>
                                <span className="text-lg font-semibold">Etapa 3: Concretizar parceria</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 pt-0">
                           <div className="space-y-6">
                             <Alert variant="default" className="bg-green-50 border-green-200 mt-4">
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">Contrato Assinado com Sucesso!</AlertTitle>
                                <AlertDescription className="text-green-700">
                                Obrigado! Sua assinatura foi registrada. Para iniciar os serviços, realize o pagamento da primeira parcela via PIX.
                                </AlertDescription>
                            </Alert>
                             <div className="flex justify-center">
                                 {provider && firstCharge ? (
                                    <StaticPixQRCode provider={provider} charge={firstCharge} />
                                 ) : (
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Instruções de Pagamento</AlertTitle>
                                        <AlertDescription>
                                            Não foi possível gerar o QR Code. Por favor, entre em contato com <strong>{provider?.full_name || 'a contratada'}</strong> pelo e-mail <strong>{provider?.email || '[e-mail não disponível]'}</strong> para receber a chave PIX e realizar o pagamento.
                                        </AlertDescription>
                                    </Alert>
                                 )}
                            </div>
                            <p className="text-xs text-muted-foreground text-center w-full">
                                Após o pagamento, a contratada será notificada para dar início aos trabalhos.
                            </p>
                            
                             <div className="pt-6">
                                <h3 className="text-lg font-semibold mb-4">Cópia do Contrato Assinado</h3>
                                <div
                                    id="contract-content-for-pdf"
                                    className="prose prose-sm max-w-none rounded-md border bg-gray-50 p-6"
                                    dangerouslySetInnerHTML={{ __html: contract.full_contract_text || '' }}
                                />
                            </div>
                        </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>

            </Accordion>
        </main>
      </div>
    </>
  )
}
