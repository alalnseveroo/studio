
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, notFound } from 'next/navigation'
import { getContractForClientById, signContractAsClient } from '@/lib/actions/contratos'
import { getProfile } from '@/lib/actions/profile'
import { sendClientVerificationCode } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import type { Contrato, Profile, Cobranca } from '@/lib/types'
import { Loader2, ArrowLeft, ShieldCheck, Download, Edit, Send, Info, MailCheck, FileText, Lock, CreditCard, CheckCircle, AlertCircle, BadgeCheck, Check, PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { format } from 'date-fns'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import SignatureCanvas from 'react-signature-canvas'
import { cn } from '@/lib/utils'
import { StaticPixQRCode } from '@/components/static-pix-qrcode'
import { Separator } from '@/components/ui/separator'


type OtpStep = 'initial' | 'otp_sent' | 'verifying' | 'signed';

export default function ContratoPortalPage() {
  const params = useParams()
  const clientId = params.id as string
  const contractId = params.contractId as string

  const [contract, setContract] = useState<Contrato | null>(null)
  const [provider, setProvider] = useState<(Profile & {email: string}) | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [otpStep, setOtpStep] = useState<OtpStep>('initial');
  const [otp, setOtp] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const { toast } = useToast()

  const fetchContract = useCallback(async () => {
    if (!contractId || !clientId) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    const { data: contractData, error: contractError } = await getContractForClientById(contractId);

    if (contractError || !contractData || contractData.cliente_id !== clientId) {
      console.error("Error fetching contract or invalid contract for client", contractError);
      setContract(null);
      setProvider(null);
      setIsLoading(false);
      return;
    }

    setContract(contractData);

    const { data: providerData, error: providerError } = await getProfile(contractData.user_id);
    if (providerError || !providerData) {
      console.error("Could not fetch provider profile for contract portal", providerError);
      setProvider(null);
    } else {
      setProvider(providerData as Profile & { email: string });
    }

    if (contractData.client_signature_data) {
        setOtpStep('signed');
    }

    setIsLoading(false);
  }, [contractId, clientId]);


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
    
    if(!contract) return;
    const { success, error, message } = await sendClientVerificationCode(contract.id)
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
    
    if(!contract) return;
    const { data, error } = await signContractAsClient({ contractId: contract.id, otp, signatureDataUrl: signature })
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
      // Refetch data to get the new charge and updated contract status
      await fetchContract();
      setOtpStep('signed');
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
    return (
         <div className="flex min-h-screen items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Contrato não encontrado</AlertTitle>
                <AlertDescription>
                    O contrato que você está tentando acessar não existe, foi removido ou não pertence a este portal. Por favor, verifique o link ou entre em contato com o prestador de serviço.
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  const isSignedByProvider = !!contract.provider_signature_data
  const isSignedByClient = !!contract.client_signature_data
  const isReadyToSign = isSignedByProvider && !isSignedByClient;
  
  const firstCharge: Cobranca | undefined = isSignedByClient && contract.clientes?.Cobranca ? contract.clientes.Cobranca.find(c => c.value === contract.propostas?.value) : undefined;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
           <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href={`/portal/${clientId}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <h1 className="flex-1 text-xl font-semibold">Contrato {contract.contract_code}</h1>
             {isSignedByClient && (
                <Button onClick={handleDownloadPdf} size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                </Button>
            )}
       </header>

       <main className="flex-1 gap-8 p-4 sm:p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
                {/* Coluna Esquerda: Preview do Contrato */}
                <div id="contract-content-for-pdf">
                    <div className="bg-white shadow-md rounded-lg">
                        <div 
                            className="prose prose-sm max-w-none p-6 h-[70vh] overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: contract.full_contract_text || '' }}
                        />
                    </div>
                </div>

                 {/* Coluna Direita: Ações */}
                <div className="sticky top-20">
                     {isSignedByClient && provider && firstCharge ? (
                        <div className="space-y-4">
                             <div className="text-center">
                                <h2 className="text-xl font-bold">Concretize a Parceria</h2>
                                <p className="text-muted-foreground mt-1">Para iniciar os serviços, realize o pagamento da primeira parcela via PIX.</p>
                            </div>
                            <StaticPixQRCode provider={provider} charge={firstCharge} />
                            <p className="text-xs text-muted-foreground text-center w-full">
                                Após o pagamento, a contratada será notificada para dar início aos trabalhos.
                            </p>
                        </div>
                     ) : !isReadyToSign ? (
                         <Alert variant="default">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Aguardando Prestador(a)</AlertTitle>
                            <AlertDescription>
                                O contrato está sendo preparado. Assim que o prestador(a) de serviço assinar, você será notificado(a) por e-mail para prosseguir com sua assinatura.
                            </AlertDescription>
                        </Alert>
                     ) : (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold">Assinatura do Cliente</h2>
                                <p className="text-muted-foreground mt-2">Para sua segurança, desenhe sua assinatura e confirme com o código de 6 dígitos que será enviado para o seu e-mail.</p>
                            </div>
                            <Separator />
                            
                            {otpStep !== 'signed' && (
                                <div className="space-y-4">
                                     <label className="text-sm font-medium flex items-center gap-2"><PencilLine className="h-4 w-4"/> 1. Desenhe sua assinatura</label>
                                     <div className="w-full h-40 rounded-md border border-input bg-background">
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
                            )}

                             {otpStep === 'otp_sent' && (
                                <div className="space-y-4">
                                    <label className="text-sm font-medium flex items-center gap-2"><Lock className="h-4 w-4" /> 2. Insira o código de verificação</label>
                                     <div className="flex flex-col items-start gap-2">
                                        <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                                            </InputOTPGroup>
                                             <InputOTPGroup>
                                                <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                </div>
                             )}
                             
                             {otpStep === 'verifying' && (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    <p>Verificando...</p>
                                </div>
                            )}

                            {otpStep !== 'signed' && (
                                <Button 
                                    onClick={otpStep === 'otp_sent' ? handleVerifyAndSign : handleSendCode} 
                                    disabled={otpStep === 'verifying'} 
                                    className="w-full"
                                    size="lg"
                                >
                                    {otpStep === 'verifying' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {otpStep === 'otp_sent' ? 'Verificar e Assinar' : 'Confirmar e Enviar Código'}
                                </Button>
                            )}

                             {otpStep === 'signed' && (
                                 <Alert variant="default" className="bg-green-50 border-green-200">
                                    <BadgeCheck className="h-4 w-4 text-green-600" />
                                    <AlertTitle className="text-green-800">Assinatura Concluída!</AlertTitle>
                                    <AlertDescription className="text-green-700">
                                        Seu contrato foi assinado com sucesso. Avance para o pagamento.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                     )}
                </div>
            </div>
       </main>
    </div>
  )
}
