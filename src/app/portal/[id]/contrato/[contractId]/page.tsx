
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, notFound } from 'next/navigation'
import { getContractForClientById, signContractAsClient } from '@/lib/actions/contratos'
import { getProfile } from '@/lib/actions/profile'
import { sendClientVerificationCode } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import type { Contrato, Profile } from '@/lib/types'
import { Loader2, ArrowLeft, UserCheck, ShieldCheck, Download, Edit, Send, Info, MailCheck, FileText, Lock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { format } from 'date-fns'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import SignatureCanvas from 'react-signature-canvas'
import PixQRCode from '@/components/pix-qrcode'
import { cn } from '@/lib/utils'


type Step = 1 | 2 | 3;
type OtpStep = 'initial' | 'otp_sent' | 'verifying';


export default function ContratoPortalPage() {
  const params = useParams()
  const clientId = params.id as string
  const contractId = params.contractId as string

  const [contract, setContract] = useState<Contrato | null>(null)
  const [provider, setProvider] = useState<(Profile & {email: string}) | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
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
        } else {
          setProvider(providerData as Profile & { email: string });
        }
      }
      // Se já assinado, vai direto para a etapa final
      if (data.client_signature_data) {
        setCurrentStep(3);
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
    
    const { error } = await signContractAsClient({ contractId: contract!.id, otp, signatureDataUrl: signature })
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
      await fetchContract()
      setCurrentStep(3);
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

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!contract) {
    return notFound()
  }

  const isSignedByProvider = !!contract.provider_signature_data
  const isSignedByClient = !!contract.client_signature_data
  const isReadyToSign = isSignedByProvider && !isSignedByClient;

  const steps = [
    { id: 1, name: 'Revisar o contrato', icon: FileText },
    { id: 2, name: 'Solicitar verificação e assinar', icon: Lock },
    { id: 3, name: 'Concretizar parceria', icon: CreditCard },
  ];

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
             {isSignedByClient && (
                <Button onClick={handleDownloadPdf} size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                </Button>
            )}
          </div>
          
           {/* Steps Navigator */}
           <div className="p-4 rounded-lg border bg-card">
              <nav aria-label="Progress">
                <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                  {steps.map((step, index) => (
                    <li key={step.name} className="md:flex-1">
                      <div
                        className={cn(
                          "group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
                          currentStep > step.id ? "border-primary" : "border-gray-200",
                           currentStep === step.id ? "border-primary" : "group-hover:border-gray-300",
                        )}
                      >
                        <span
                           className={cn(
                            "text-sm font-semibold uppercase tracking-wider",
                            currentStep > step.id ? "text-primary" : "text-muted-foreground",
                            currentStep === step.id ? "text-primary" : ""
                          )}
                        >
                          ETAPA {step.id}
                        </span>
                        <span className="text-sm font-medium">{step.name}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          
            {/* Step 1: Review Contract */}
            {currentStep === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Etapa 1: Revise os Termos do Contrato</CardTitle>
                        <CardDescription>
                            Leia atentamente todo o contrato abaixo. Se estiver de acordo, prossiga para a próxima etapa.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            id="contract-content"
                            className="prose prose-sm max-w-none rounded-md border bg-gray-50 p-6"
                            dangerouslySetInnerHTML={{ __html: contract.full_contract_text || '' }}
                        />
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => setCurrentStep(2)} disabled={!isReadyToSign} className="ml-auto">
                            {isReadyToSign ? 'Li e concordo, avançar para assinatura' : 'Aguardando assinatura da contratada'}
                        </Button>
                    </CardFooter>
                </Card>
            )}
            
            {/* Step 2: Sign */}
            {currentStep === 2 && (
                <Card>
                     <CardHeader>
                        <CardTitle>Etapa 2: Assinatura Digital</CardTitle>
                        <CardDescription>
                          Para sua segurança, desenhe sua assinatura e confirme com o código de 6 dígitos que será enviado para o seu e-mail.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
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
                      </CardContent>
                      <CardFooter className="gap-2">
                         <Button variant="outline" onClick={() => setCurrentStep(1)}>Voltar</Button>
                         <div className="flex-grow" />
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
                      </CardFooter>
                </Card>
            )}

            {/* Step 3: Payment */}
             {currentStep === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Etapa 3: Concretize a Parceria</CardTitle>
                        <Alert variant="default" className="bg-green-50 border-green-200 mt-4">
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-800">Contrato Assinado com Sucesso!</AlertTitle>
                          <AlertDescription className="text-green-700">
                            Obrigado! Sua assinatura foi registrada. Para iniciar os serviços, realize o pagamento da primeira parcela.
                          </AlertDescription>
                        </Alert>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        {provider ? (
                             <PixQRCode
                                pixKey={provider.cpf || provider.cnpj || ''}
                                value={contract.propostas?.value || 0}
                                beneficiaryName={provider.full_name || provider.company_name || 'Beneficiário'}
                                beneficiaryCity={provider.address?.split(',').slice(-2, -1)[0]?.trim() || 'CIDADE'}
                            />
                        ) : (
                            <p>Carregando informações de pagamento...</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-muted-foreground text-center w-full">
                            Após o pagamento, a contratada será notificada para dar início aos trabalhos.
                        </p>
                    </CardFooter>
                </Card>
            )}
          
          {/* Div oculta para geração de PDF */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div id="contract-content-for-pdf" className="prose" dangerouslySetInnerHTML={{ __html: contract.full_contract_text || '' }} />
          </div>

        </main>
      </div>
    </>
  )
}

    