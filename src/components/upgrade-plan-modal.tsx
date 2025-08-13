
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from './ui/button'
import { CheckCircle, Zap } from 'lucide-react'

interface UpgradePlanModalProps {
  isOpen: boolean
  onClose: () => void
}

const PlanCard = ({ title, description, features, buttonText, isFeatured }: { title: string, description: string, features: string[], buttonText: string, isFeatured?: boolean }) => {
    return (
        <Card className={isFeatured ? 'border-primary' : ''}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500"/>
                        <span>{feature}</span>
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                 <Button className="w-full">
                    {isFeatured && <Zap className="mr-2 h-4 w-4" />}
                    {buttonText}
                 </Button>
            </CardFooter>
        </Card>
    )
}


export function UpgradePlanModal({ isOpen, onClose }: UpgradePlanModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">Parabéns pelo seu crescimento!</DialogTitle>
          <DialogDescription className="max-w-xl mx-auto">
            Vimos que você está pronta para automatizar a cobrança do seu segundo cliente. Isso é incrível e mostra que seu negócio está a evoluir!
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 py-6">
            <PlanCard
                title="Crédito por Cliente"
                description="Ideal para quem está começando. Pague apenas pelos clientes que gerencia ativamente."
                features={["Todos os benefícios", "Contratos ilimitados", "Cobrança automática", "Portal do cliente"]}
                buttonText="Adquirir Crédito"
            />
            <PlanCard
                title="Plano Total"
                description="Para quem busca o máximo, sem se preocupar com limites. Fidelize e obtenha o máximo de clientes possível."
                features={["Tudo ilimitado", "Clientes ilimitados", "Suporte prioritário", "Acesso a novas features"]}
                buttonText="Assinar Plano Total"
                isFeatured
            />
        </div>
      </DialogContent>
    </Dialog>
  )
}
