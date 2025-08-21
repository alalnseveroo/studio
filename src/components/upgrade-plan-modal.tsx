
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft, CreditCard, Users, Briefcase, Loader2, RefreshCw, Minus, Plus, ShieldCheck, Gift, FileText, Globe, BarChart3, Star, Info } from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import Link from 'next/link'
import { getProfile, saveProfile } from '@/lib/actions/profile'
import { getOrCreateAsaasCustomer } from '@/lib/asaas'
import type { Profile } from '@/lib/types'
import confetti from "canvas-confetti";
import { createAsaasCharge, createAsaasPaymentLink, getAsaasPixCharge } from '@/lib/asaas'
import { PixQRCode } from './pix-qrcode'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipProvider, TooltipTrigger } from './ui/tooltip'


export const triggerConfetti = () => {
    const end = Date.now() + 3 * 1000; // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };

    frame();
};

const benefitItems = [
    { text: "Contratos ilimitados", icon: FileText },
    { text: "Nota fiscal automática", icon: BarChart3 },
    { text: "Cobrança automática", icon: ShieldCheck },
    { text: "Recorrência via PIX", icon: CreditCard },
    { text: "Portal do cliente com sua marca", icon: Gift },
    { text: "Perfil exposto no Google", icon: Globe },
    { text: "Controle do seu negócio", icon: Star },
    { text: "E-mail marketing (em breve)", icon: Star },
];

const CheckoutDisplay = ({ paymentId, paymentLink, onRetry }: { paymentId: string; paymentLink: string; onRetry: () => void; }) => (
    <div className="w-full max-w-md mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">Finalize seu Pagamento</h2>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-6">
            <div>
                <h3 className="font-semibold mb-4 text-center">Opção 1: Pagar com PIX</h3>
                <PixQRCode paymentId={paymentId} />
            </div>
            <div className="relative flex items-center">
                <div className="flex-grow border-t border-muted"></div>
                <span className="flex-shrink mx-4 text-muted-foreground text-xs">OU</span>
                <div className="flex-grow border-t border-muted"></div>
            </div>
            <div>
                 <h3 className="font-semibold mb-4 text-center">Opção 2: Pagar com Cartão de Crédito</h3>
                <Button asChild className="w-full">
                    <Link href={paymentLink} target="_blank" rel="noopener noreferrer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pagar com Cartão
                    </Link>
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">Você será redirecionado para um ambiente seguro para finalizar a compra.</p>
            </div>
        </div>
        <div className="text-center mt-4">
             <Button variant="link" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Gerar novamente
            </Button>
        </div>
    </div>
);


interface UpgradePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'selection' | 'checkout' | 'loading' | 'error';

interface CheckoutData {
  paymentId: string;
  paymentLink: string;
}

export function UpgradePlanModal({ isOpen, onClose }: UpgradePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('credits');
  const [amount, setAmount] = useState(7);
  const [step, setStep] = useState<Step>('selection');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
        const fetchProfileData = async () => {
            const { data } = await getProfile();
            setUserProfile(data as Profile | null);
        };
        fetchProfileData();
    }
  }, [isOpen]);
  
  const handleContinue = async () => {
    setStep('loading');
    setError(null);
    setCheckoutData(null);
    
    if (!userProfile) {
        setError("Não foi possível carregar os dados do seu perfil. Tente novamente.");
        setStep('error');
        return;
    }

    const { asaas_customer_id } = userProfile;
    if (!asaas_customer_id) {
         setError("Sua conta de pagamentos não foi encontrada. Contate o suporte.");
         setStep('error');
         return;
    }
    
    const creditsToBuy = Math.floor(amount / 7);
    const description = `Compra de ${creditsToBuy} crédito(s) Crivo`;

    const { payment, error: chargeError } = await createAsaasCharge({
        customer: asaas_customer_id,
        value: amount,
        dueDate: new Date().toISOString().split('T')[0],
        description: description,
    });
    
    if (chargeError || !payment) {
        setError(chargeError?.message || "Ocorreu um erro ao criar a cobrança. Tente novamente.");
        setStep('error');
        return;
    }
    
    const { link, error: linkError } = await createAsaasPaymentLink(payment.id);

    if (linkError || !link) {
        setError(linkError?.message || "Ocorreu um erro ao gerar o link de pagamento. Tente novamente.");
        setStep('error');
        return;
    }

    setCheckoutData({ paymentId: payment.id, paymentLink: link });
    setStep('checkout');
  }

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setStep('selection');
        setSelectedPlan('credits');
        setAmount(7);
        setCheckoutData(null);
        setError(null);
    }, 300);
  }
  
  const handleAmountChange = (newAmount: number) => {
    const constrainedAmount = Math.max(7, newAmount);
    setAmount(constrainedAmount);
  };
  
  const credits = Math.floor(amount / 7);

  const renderContent = () => {
    switch (step) {
        case 'loading':
            return (
                <div className="flex flex-col justify-center items-center p-8 md:p-16 bg-background h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4"/>
                    <p className="text-muted-foreground">Gerando seu checkout seguro...</p>
                </div>
            );
        case 'error':
             return (
                <div className="flex flex-col justify-center items-center p-8 md:p-16 bg-background h-full text-center">
                    <h2 className="text-xl font-bold text-destructive">Oops! Algo deu errado.</h2>
                    <p className="text-muted-foreground mt-2">{error}</p>
                    <Button onClick={handleContinue} className="mt-6">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Tentar Novamente
                    </Button>
                </div>
            );
        case 'checkout':
             return (
                 <div className="flex flex-col justify-center p-8 md:p-16 bg-background h-full">
                     {checkoutData && (
                        <CheckoutDisplay 
                            paymentId={checkoutData.paymentId}
                            paymentLink={checkoutData.paymentLink}
                            onRetry={handleContinue}
                        />
                     )}
                 </div>
            );
        case 'selection':
        default:
             return (
                <div className="flex flex-col justify-center items-center p-8 md:p-16 bg-background">
                    <div className="w-full max-w-md mx-auto">
                        <div
                            className={cn(
                                "cursor-pointer rounded-xl border-2 p-5 transition-all h-full flex flex-col bg-[#faf5ff]",
                                "border-primary shadow-lg"
                            )}
                        >
                            <h3 className="font-bold text-base">Obtenha créditos</h3>
                            <p className="text-xs text-muted-foreground mt-1">Os créditos funcionam como uma reserva para habilitar suas cobranças e contratos. Mas não se preocupe, é deduzido somente quando você tiver sucesso: contrato assinado ou cobrança recorrente ativa.</p>
                            
                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-2xl font-bold">
                                    R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button size="icon" variant="outline" className="rounded-full h-8 w-8" onClick={() => handleAmountChange(amount - 7)} disabled={amount <= 7}>
                                        <Minus className="h-5 w-5" />
                                    </Button>
                                    <span className="font-bold w-12 text-center">{credits} crédito{credits !== 1 ? 's' : ''}</span>
                                    <Button size="icon" variant="outline" className="rounded-full h-8 w-8" onClick={() => handleAmountChange(amount + 7)}>
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 pt-4 mt-4 border-t">
                                {benefitItems.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-2 text-xs">
                                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0"/>
                                        <span>{feature.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button size="lg" className="text-base py-6 w-full" onClick={handleContinue}>
                                Comprar {credits} crédito{credits !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </div>
                </div>
            );
    }
  }
  
  const getLeftColumnContent = () => {
    switch(step) {
        case 'checkout':
            return {
                title: 'Quase lá! Escolha como pagar',
                image: "https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/Rewards%202.png",
                alt: "Pagamento"
            };
        case 'loading':
        case 'error':
             return {
                title: 'Aguarde um momento',
                image: "https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/High%20Five%203.png",
                alt: "Carregando"
            };
        case 'selection':
        default:
             return {
                title: 'Parabéns pelo seu crescimento!',
                image: "https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/STARTUP%2011.png",
                alt: "Gráficos e planilhas"
            };
    }
  }
  
  const { title, image, alt } = getLeftColumnContent();


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="h-screen w-screen max-w-full p-0 gap-0">
             <DialogHeader className="sr-only">
                <DialogTitle>Atualizar Plano</DialogTitle>
                <DialogDescription>
                    Selecione um novo plano para continuar adicionando clientes.
                </DialogDescription>
            </DialogHeader>
             <div className="grid md:grid-cols-2 h-full">
                {/* Coluna da Esquerda */}
                <div className="hidden md:flex flex-col justify-center items-start p-8 md:p-16 bg-muted/50">
                    <div className="text-left w-full max-w-md">
                         <Button variant="ghost" onClick={step === 'selection' ? handleClose : () => setStep('selection')} className="mb-4 pl-0">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                        
                        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
                         {step === 'selection' && 
                             <p className="mt-4 text-muted-foreground">
                                Vimos que você está pronto para automatizar a cobrança do seu segundo cliente. Isso é incrível e mostra que seu negócio está a evoluir!
                            </p>
                         }
                    </div>
                    <div className={cn("mt-8 flex justify-center w-full")}>
                        <Image 
                            src={image}
                            alt={alt}
                            width={300}
                            height={300}
                            className="w-[200px] h-[200px] md:w-[300px] md:h-[300px]"
                        />
                    </div>
                </div>
                {renderContent()}
            </div>
        </DialogContent>
    </Dialog>
  )
}
