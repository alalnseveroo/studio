

'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Zap, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const PlanCard = ({ title, description, price, features, buttonText, isFeatured }: { title: string, description: string, price: string, features: string[], buttonText: string, isFeatured?: boolean }) => {
    return (
        <Card className={isFeatured ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                 <div className="text-2xl font-bold">{price}</div>
                <div className="space-y-2 pt-2">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-4 w-4 text-green-500"/>
                            <span>{feature}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" variant={isFeatured ? 'default' : 'outline'}>
                    {isFeatured && <Zap className="mr-2 h-4 w-4" />}
                    {buttonText}
                 </Button>
            </CardFooter>
        </Card>
    )
}

interface UpgradePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UpgradePlanModal({ isOpen, onClose }: UpgradePlanModalProps) {
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
                <div className="flex flex-col justify-center p-8 md:p-16 space-y-6 bg-background">
                    <PlanCard
                        title="Crédito por Cliente"
                        description="Ideal para quem está começando. Pague apenas pelos clientes que gerencia ativamente."
                        price="R$ 10,00"
                        features={["Todos os benefícios", "Contratos ilimitados", "Cobrança automática", "Portal do cliente"]}
                        buttonText="Adquirir Crédito"
                    />
                    <PlanCard
                        title="Plano Total"
                        description="Para quem busca o máximo, sem se preocupar com limites. Fidelize e obtenha o máximo de clientes possível."
                        price="R$ 49,90/mês"
                        features={["Tudo ilimitado", "Clientes ilimitados", "Suporte prioritário", "Acesso a novas features"]}
                        buttonText="Assinar Plano Total"
                        isFeatured
                    />
                </div>
            </div>
        </DialogContent>
    </Dialog>
  )
}
