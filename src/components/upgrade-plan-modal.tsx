
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Zap, ArrowLeft, Check } from 'lucide-react'
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
import { Label } from './ui/label'

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
    isFeatured
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
    isFeatured?: boolean
}) => {
    const isSelected = selectedPlan === planId;
    return (
        <label
            htmlFor={planId}
            className={cn(
                "block cursor-pointer rounded-xl border-2 p-5 transition-all",
                isSelected ? "border-primary shadow-lg" : "border-border"
            )}
        >
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{title}</h3>
                <RadioGroup>
                    <RadioGroupItem value={planId} id={planId} checked={isSelected} onClick={() => onSelect(planId)} />
                </RadioGroup>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            <div className="mt-4">
                <span className="text-3xl font-bold">{price}</span>
                <span className="text-sm text-muted-foreground">{priceSuffix}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{bodyText}</p>
             <div className="space-y-2.5 pt-4">
                {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                        <span>{feature}</span>
                    </div>
                ))}
            </div>
        </label>
    )
}

interface UpgradePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UpgradePlanModal({ isOpen, onClose }: UpgradePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('professional');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="h-screen w-screen max-w-full p-0 gap-0">
             <DialogHeader className="sr-only">
                <DialogTitle>Atualizar Plano</DialogTitle>
                <DialogDescription>
                    Selecione um novo plano para continuar adicionando clientes.
                </DialogDescription>
            </DialogHeader>
             <div className="grid md:grid-cols-2 h-full">
                <div className="flex flex-col justify-center items-start p-8 md:p-16 bg-muted/50">
                    <div className="text-left w-full max-w-md">
                         <Button variant="ghost" onClick={onClose} className="mb-4 pl-0">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-bold">Parabéns pelo seu crescimento!</h1>
                        <p className="mt-4 text-muted-foreground">
                            Vimos que você está pronto para automatizar a cobrança do seu segundo cliente. Isso é incrível e mostra que seu negócio está a evoluir!
                        </p>
                    </div>
                    <div className="mt-8 flex justify-center w-full">
                        <Image 
                            src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/pie-and-charts.png"
                            alt="Gráficos e planilhas"
                            width={300}
                            height={300}
                            className="w-[200px] h-[200px] md:w-[300px] md:h-[300px]"
                        />
                    </div>
                </div>
                <div className="flex flex-col justify-center p-8 md:p-16 bg-background">
                    <div className="space-y-6 w-full max-w-md mx-auto">
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
                                "Contratos completos",
                                "Cancele a qualquer momento, sem burocracia."
                            ]}
                            selectedPlan={selectedPlan}
                            onSelect={setSelectedPlan}
                        />
                        <PlanCard
                            planId="professional"
                            title="Plano Profissional"
                            description="Perfeito para quem já tem uma carteira de clientes e quer escalar sem limites."
                            price="R$ 29,90"
                            priceSuffix="/mês"
                            bodyText="Tudo ilimitado. A tranquilidade de um custo fixo para crescer o seu negócio sem surpresas."
                            features={[
                                "Clientes ILIMITADOS na gestão automática.",
                                "Contratos e Propostas ILIMITADOS.",
                                "Acesso a todas as funcionalidades premium.",
                                "O melhor custo-benefício a partir de 3 clientes."
                            ]}
                            selectedPlan={selectedPlan}
                            onSelect={setSelectedPlan}
                            isFeatured
                        />
                         <Button size="lg" className="w-full text-base py-6">
                            {selectedPlan === 'flexible' ? 'Continuar com o Plano Flexível' : 'Assinar Plano Profissional'}
                        </Button>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
  )
}
