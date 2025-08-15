
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft, CreditCard, Users, Briefcase } from 'lucide-react'
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
import { getProfile } from '@/lib/actions/profile'
import type { Profile } from '@/lib/types'
import confetti from "canvas-confetti";

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

const CreditOptionCard = ({
    icon: Icon,
    title,
    description,
    href
}: {
    icon: React.ElementType,
    title: string,
    description: string,
    href: string
}) => {
    return (
         <Link href={href} target="_blank" rel="noopener noreferrer" className="block w-full">
            <div className="flex items-center gap-4 rounded-xl border-2 p-5 transition-all hover:border-primary hover:shadow-lg">
                <div className="p-3 bg-muted rounded-full">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-base">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
        </Link>
    )
}


interface UpgradePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'selection' | 'offer' | 'credits';

const BASE_LINK_MENSAL = "https://pay.kirvano.com/7d7c5149-41dd-4bd1-b269-36500fb5c0e4";
const BASE_LINK_SEMESTRAL = "https://pay.kirvano.com/87f87449-a348-4a15-ad42-f2d9b717fe52";
const BASE_LINK_2_CREDITS = "https://pay.kirvano.com/bbf1923d-e307-4319-9cb4-9ae4ee4d5a87";
const BASE_LINK_4_CREDITS = "https://pay.kirvano.com/1d926d20-3ae9-403b-9acb-8882bdd898dd";


export function UpgradePlanModal({ isOpen, onClose }: UpgradePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [step, setStep] = useState<Step>('selection');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (isOpen) {
        const fetchProfileData = async () => {
            const { data } = await getProfile();
            setUserProfile(data as Profile | null);
        };
        fetchProfileData();
    }
  }, [isOpen]);
  
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
  }
  
  const handleContinue = () => {
    if (selectedPlan === 'professional') {
        setStep('offer');
    } else {
        setStep('credits');
    }
  }

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setStep('selection');
        setSelectedPlan('professional');
    }, 300);
  }

  const renderContent = () => {
    switch (step) {
        case 'offer':
            return (
                <div className="flex flex-col justify-center p-8 md:p-16 bg-background">
                    <div className="w-full max-w-2xl mx-auto">
                        <div className="rounded-xl border-2 p-6 transition-all border-primary shadow-lg">
                            <h3 className="font-bold text-lg">Oferta Exclusiva Semestral</h3>
                            <div className="mt-4">
                                <span className="text-3xl font-bold">R$ 34,15</span>
                                <span className="text-sm text-muted-foreground ml-2">/mês no plano de 6 meses</span>
                            </div>
                            <p className="font-semibold text-lg mt-1">Total: R$ 204,90</p>
                            <p className="text-sm text-muted-foreground mt-4">Economize e tenha tranquilidade por mais tempo com nosso plano semestral. Todos os benefícios do plano profissional com um desconto especial.</p>
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4">
                            <Button asChild size="lg" variant="outline" className="text-base py-6 border-2 border-black hover:bg-black hover:text-white">
                                <Link href={buildPaymentLink(BASE_LINK_MENSAL)}>Prefiro o mensal</Link>
                            </Button>
                             <Button asChild size="lg" className="text-base py-6 bg-green-600 hover:bg-green-700">
                                <Link href={buildPaymentLink(BASE_LINK_SEMESTRAL)}>Sim, eu aceito</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            );
        case 'credits':
            return (
                <div className="flex flex-col justify-center p-8 md:p-16 bg-background">
                    <div className="w-full max-w-lg mx-auto space-y-4">
                        <CreditOptionCard
                           icon={Users}
                           title="Pacote para 2 Clientes"
                           description="Ideal para começar a expandir sua carteira."
                           href={buildPaymentLink(BASE_LINK_2_CREDITS)}
                        />
                         <CreditOptionCard
                           icon={Briefcase}
                           title="Pacote para 4 Clientes"
                           description="O melhor custo-benefício para acelerar seu crescimento."
                           href={buildPaymentLink(BASE_LINK_4_CREDITS)}
                        />
                    </div>
                </div>
            );
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
                            <Button size="lg" className="text-base py-6" onClick={handleContinue}>
                                Continuar
                            </Button>
                        </div>
                    </div>
                </div>
            );
    }
  }
  
  const getLeftColumnContent = () => {
    switch(step) {
        case 'offer':
            return {
                title: 'Preparamos algo especial para você',
                image: "https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/Rewards%202.png",
                alt: "Oferta Especial"
            };
        case 'credits':
             return {
                title: 'Escolha qual melhor crédito para você',
                image: "https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/High%20Five%203.png",
                alt: "Pacote de créditos"
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
                    <div className={cn("mt-8 flex justify-center w-full", step === 'credits' ? 'md:justify-start' : 'md:justify-center')}>
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
