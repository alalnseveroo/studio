
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
<<<<<<< HEAD
import { Check, ArrowLeft, CreditCard, Users, Briefcase, Loader2 } from 'lucide-react'
=======
import { Check, ArrowLeft, CreditCard, Users, Briefcase, Loader2, RefreshCw } from 'lucide-react'
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e
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
<<<<<<< HEAD
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

=======
import { createAsaasCharge, createAsaasPaymentLink, getAsaasPixCharge } from '@/lib/asaas'
import PixQRCode from './pix-qrcode'
import { useToast } from '@/hooks/use-toast'
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e

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

const PlanCard = ({ 
    planId,
    title,
    description,
    price,
    priceSuffix,
    bodyText,
    features,
    selectedPlan,
    onSelect,
    isFeatured,
    className
}: { 
    planId: string,
    title: string, 
    description: string, 
    price: string, 
    priceSuffix: string,
    bodyText: string,
    features: string[], 
    selectedPlan: string,
    onSelect: (plan: string) => void,
    isFeatured?: boolean,
    className?: string
}) => {
    const isSelected = selectedPlan === planId;
    return (
        <div
            onClick={() => onSelect(planId)}
            className={cn(
                "cursor-pointer rounded-xl border-2 p-5 transition-all h-full flex flex-col",
                isSelected ? "border-primary shadow-lg" : "border-border",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-base">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
                <RadioGroup>
                    <RadioGroupItem value={planId} id={planId} checked={isSelected} />
                </RadioGroup>
            </div>
            <div className="mt-3">
                <span className="text-2xl font-bold">{price}</span>
                <span className="text-xs text-muted-foreground ml-1">{priceSuffix}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex-grow">{bodyText}</p>
             <div className="space-y-2 pt-4 mt-auto">
                {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0"/>
                        <span>{feature}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

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

<<<<<<< HEAD
type Step = 'selection' | 'offer' | 'credits' | 'checkout';
type ButtonState = 'idle' | 'loading' | 'success';

const BASE_LINK_MENSAL = "https://pay.kirvano.com/7d7c5149-41dd-4bd1-b269-36500fb5c0e4";
const BASE_LINK_SEMESTRAL = "https://pay.kirvano.com/87f87449-a348-4a15-ad42-f2d9b717fe52";
const BASE_LINK_2_CREDITS = "https://pay.kirvano.com/bbf1923d-e307-4319-9cb4-9ae4ee4d5a87";
const BASE_LINK_4_CREDITS = "https://pay.kirvano.com/1d926d20-3ae9-403b-9acb-8882bdd898dd";
=======
type Step = 'selection' | 'checkout' | 'loading' | 'error';
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e

interface CheckoutData {
  paymentId: string;
  paymentLink: string;
}

export function UpgradePlanModal({ isOpen, onClose }: UpgradePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [step, setStep] = useState<Step>('selection');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
<<<<<<< HEAD
  const [buttonState, setButtonState] = useState<ButtonState>('idle');
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();
=======
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e

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
<<<<<<< HEAD
    if (!userProfile) {
      toast({ variant: 'destructive', title: "Erro", description: "Perfil do usuário não encontrado. Por favor, recarregue a página." });
      return;
    }
    setButtonState('loading');
    
    try {
      // Garante que o usuário existe como cliente no Asaas.
      const asaasCustomer = await getOrCreateAsaasCustomer(userProfile);
      
      // Se o perfil local não tiver o ID do Asaas, atualiza-o.
      if (asaasCustomer && userProfile.asaas_customer_id !== asaasCustomer.id) {
          const profileUpdateData = { ...userProfile, asaas_customer_id: asaasCustomer.id };
          await saveProfile(profileUpdateData as any); // A 'is_completed' field might be missing, casting to any for now
          setUserProfile(profileUpdateData); // Update local state
      }

      setButtonState('success');
      
      setTimeout(() => {
         if (selectedPlan === 'professional') {
            setStep('offer');
         } else {
            // Se o plano for flexível, redireciona para a página de compra de créditos
            handleClose(); // Fecha o modal
            router.push('/dashboard/settings/buy-credits');
         }
        setButtonState('idle'); // Reset button for the next screen
      }, 1000); // Wait 1 second to show the success checkmark

    } catch (error: any) {
        setButtonState('idle');
        toast({ variant: 'destructive', title: "Erro de Sincronização", description: error.message });
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setStep('selection');
        setSelectedPlan('professional');
        setButtonState('idle');
    }, 300);
  }
  
  const buildPaymentLink = (baseUrl: string) => {
    if (!userProfile) return baseUrl;

    const params = new URLSearchParams();
    if (userProfile.full_name || userProfile.company_name) {
        params.append('customer.name', userProfile.full_name || userProfile.company_name!);
    }
    if (userProfile.email) {
        params.append('customer.email', userProfile.email);
    }
    if (userProfile.cpf || userProfile.cnpj) {
        params.append('customer.document', userProfile.cpf || userProfile.cnpj!);
    }
    if (userProfile.phone) {
        params.append('customer.phone', userProfile.phone.replace(/\D/g, ''));
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
=======
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
    
    let description = '';
    let value = 0;

    if (selectedPlan === 'professional') {
        description = 'Assinatura Plano Profissional Crivo - Mensal';
        value = 49.90;
    } else { // flexible
        description = 'Compra de 2 créditos Crivo';
        value = 20.00; // 2 * R$10
    }

    const { payment, error: chargeError } = await createAsaasCharge({
        customer: asaas_customer_id,
        value: value,
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
        setSelectedPlan('professional');
        setCheckoutData(null);
        setError(null);
    }, 300);
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e
  }

  const renderContent = () => {
    switch (step) {
        case 'loading':
            return (
                <div className="flex flex-col justify-center items-center p-8 md:p-16 bg-background h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4"/>
                    <p className="text-muted-foreground">Gerando seu checkout seguro...</p>
                </div>
            );
<<<<<<< HEAD
=======
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
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e
        case 'selection':
        default:
             return (
                <div className="flex flex-col justify-center p-8 md:p-16 bg-background">
                    <div className="w-full max-w-2xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                            <PlanCard
                                planId="flexible"
                                title="Plano Flexível"
                                description="Ideal para quem está começando ou prefere não ter um custo fixo mensal."
                                price="R$ 10,00"
                                priceSuffix="/mês, por cliente ativo"
                                bodyText="Pague apenas pelos clientes que assinou contrato ou você coloca no piloto automático. Cadastrar contatos na sua base é sempre gratuito."
                                features={[
                                    "Seu 1º cliente é grátis, sempre!",
                                    "Cobrança automática e notas fiscais",
                                    "Portal do Cliente.",
                                    "Contratos completo",
                                    "Cancele a qualquer momento, sem burocracia.",
                                ]}
                                selectedPlan={selectedPlan}
                                onSelect={setSelectedPlan}
                                className="bg-[#faf5ff]"
                            />
                            <PlanCard
                                planId="professional"
                                title="Plano Profissional"
                                description="Perfeito para quem já tem uma carteira de clientes e quer escalar sem limites."
                                price="R$ 49,90"
                                priceSuffix="/mês"
                                bodyText="Tudo ilimitado. A tranquilidade de um custo fixo para crescer o seu negócio sem surpresas."
                                features={[
                                    "Clientes ILIMITADOS na gestão automática.",
                                    "Contratos e Propostas ILIMITADOS.",
                                    "Acesso a todas as funcionalidades premium.",
                                    "O melhor custo-benefício a partir de 3 clientes.",
                                ]}
                                selectedPlan={selectedPlan}
                                onSelect={setSelectedPlan}
                                isFeatured
                                className="bg-[#f0fdf4]"
                            />
                        </div>
                        <div className="mt-6 flex justify-end">
<<<<<<< HEAD
                             <Button size="lg" className="text-base py-6 w-40" onClick={handleContinue} disabled={buttonState !== 'idle'}>
                                {buttonState === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
                                {buttonState === 'success' && <Check className="h-6 w-6" />}
                                {buttonState === 'idle' && 'Continuar'}
=======
                            <Button size="lg" className="text-base py-6" onClick={handleContinue}>
                                Continuar para o Pagamento
>>>>>>> 806b9d1cb4f0ce30ac3a48935ca0a1bffcabeb3e
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
                <div className="flex flex-col justify-center items-start p-8 md:p-16 bg-muted/50">
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
