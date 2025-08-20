

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getContractById, signContractAsProvider } from '@/lib/actions/contratos'
import { sendSignatureOtp } from '@/lib/actions/auth'
import { getProfile } from '@/lib/actions/profile'
import { useToast } from '@/hooks/use-toast'
import type { Contrato, Profile } from '@/lib/types'
import { Loader2, ArrowLeft, UserCheck, Info, MailCheck, Check, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Checkbox } from '@/components/ui/checkbox'


type SigningStep = 'initial' | 'otp_sent' | 'verifying' | 'success' | 'already_signed';

export default function ContratoDetailPage() {
  const params = useParams()
  const contractId = params.id as string
  
  const [contract, setContract] = useState<Contrato | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [signingStep, setSigningStep] = useState<SigningStep>('initial')
  const [otp, setOtp] = useState('')
  const [hasAgreed, setHasAgreed] = useState(false)
  const { toast } = useToast()

  const fetchContractAndProfile = useCallback(async () => {
    if (!contractId) return
    setIsLoading(true)
    
    const [{ data: contractData, error: contractError }, { data: profileData }] = await Promise.all([
        getContractById(contractId),
        getProfile()
    ]);
    
    if (contractError) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Carregar Contrato',
        description: contractError.message,
      })
    } else {
      setContract(contractData)
      if (contractData?.provider_signature_data) {
        setSigningStep('already_signed')
      }
    }
    
    setUserProfile(profileData as Profile | null);
    setIsLoading(false)
  }, [contractId, toast])

  useEffect(() => {
    fetchContractAndProfile()
  }, [fetchContractAndProfile])

  const handleSendOtp = async () => {
      setSigningStep('verifying');
      const { success, error, email } = await sendSignatureOtp();
      if (error) {
          toast({ variant: 'destructive', title: 'Erro ao Enviar Código', description: error.message });
          setSigningStep('initial');
      } else if (success && email) {
          toast({ title: 'Código Enviado!', description: `Enviamos um código para ${email}.` });
          setSigningStep('otp_sent');
      }
  }

  const handleSignContract = async () => {
    if (otp.length < 6) {
        toast({ variant: 'destructive', title: 'Código Inválido', description: 'O código deve ter 6 dígitos.' });
        return;
    }
    setSigningStep('verifying');
    const { error } = await signContractAsProvider(contractId, otp)

    if (error) {
       toast({
        variant: 'destructive',
        title: 'Erro ao Assinar',
        description: error.message,
      })
      setSigningStep('otp_sent');
      setOtp('');
    } else {
      setSigningStep('success');
      toast({
        title: 'Contrato Assinado!',
        description: 'Sua assinatura foi registrada com sucesso.',
        className: 'bg-green-100 border-green-200 text-green-800'
      })
      setTimeout(() => {
        fetchContractAndProfile()
      }, 2000);
    }
  }
  
  if (isLoading) {
    return <div className="flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!contract || !userProfile) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-6">
        <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
                { !contract ? "Contrato não encontrado" : "Perfil não encontrado"}
            </h3>
        </div>
      </div>
    )
  }
  
  const contractValue = contract.propostas?.value ? `R$ ${Number(contract.propostas.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
  const clientName = contract.clientes?.full_name || contract.clientes?.company_name || '[Cliente]';
  const providerName = userProfile?.full_name || userProfile?.company_name || '[Seu Nome]';

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
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
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Coluna Esquerda: Preview do Contrato */}
        <Card>
            <CardHeader>
                <CardTitle>Visualização do Contrato</CardTitle>
                <CardDescription>
                    Revise todos os detalhes do contrato antes de assinar.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div 
                    className="prose prose-sm max-w-none rounded-md border bg-gray-50 p-6 h-[70vh] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: contract.full_contract_text || '' }}
                />
            </CardContent>
        </Card>

        {/* Coluna Direita: Ações de Assinatura */}
        <div className="sticky top-20">
          {signingStep === 'already_signed' && (
            <Alert variant="default" className="bg-green-50 border-green-200">
                <BadgeCheck className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Contrato Assinado por Você!</AlertTitle>
                <AlertDescription className="text-green-700">
                    Este contrato foi assinado por você em {format(new Date(contract.provider_signature_data!.signed_at), 'dd/MM/yyyy HH:mm')}. Aguardando assinatura do cliente.
                </AlertDescription>
            </Alert>
          )}

          {signingStep !== 'already_signed' && (
            <div className="space-y-6">
              <div>
                  <h2 className="text-xl font-bold">Assinar contrato</h2>
                  <p className="text-muted-foreground mt-2">Você está assinando o contrato <span className="font-semibold text-foreground">{contract.contract_code}</span>, no valor de <span className="font-semibold text-foreground">{contractValue}</span> referente ao projeto com <span className="font-semibold text-foreground">{clientName}</span>.</p>
                  <p className="text-muted-foreground mt-2">A assinatura será realizada no nome de <span className="font-semibold text-foreground">{providerName}</span>.</p>
              </div>

              <Separator />
              
               <div className="items-top flex space-x-2">
                <Checkbox id="terms1" checked={hasAgreed} onCheckedChange={(checked) => setHasAgreed(checked as boolean)} />
                <div className="grid gap-1.5 leading-none">
                    <label
                    htmlFor="terms1"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                    Li e concordo com os termos do contrato e me responsabilizo pela veracidade das informações fornecidas.
                    </label>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Para a sua segurança, um código de 6 dígitos será enviado para <span className="font-semibold text-foreground">{userProfile.email}</span>. Insira no campo abaixo para validar sua identidade e assinar o contrato.</p>
              </div>

              {signingStep === 'otp_sent' && (
                  <div className="flex flex-col items-start gap-2">
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
                       <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={handleSendOtp}>
                          Não recebeu? Reenviar código
                      </Button>
                  </div>
              )}

              {signingStep !== 'success' && (
                 <Button 
                    onClick={signingStep === 'otp_sent' ? handleSignContract : handleSendOtp} 
                    disabled={!hasAgreed || signingStep === 'verifying' || signingStep === 'success'} 
                    className="bg-[#22c55e] hover:bg-green-600"
                  >
                    {signingStep === 'verifying' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {signingStep === 'otp_sent' ? 'Verificar e Assinar' : 'Receber código de verificação'}
                 </Button>
              )}
              
              {signingStep === 'success' && (
                  <Button disabled className="bg-[#22c55e] hover:bg-green-600">
                      <Check className="mr-2 h-4 w-4" />
                      Assinado!
                  </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
