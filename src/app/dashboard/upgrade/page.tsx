
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const PlanCard = ({ title, description, price, features, buttonText, isFeatured }: { title: string, description: string, price: string, features: string[], buttonText: string, isFeatured?: boolean }) => {
    return (
        <Card className={isFeatured ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="text-3xl font-bold">{price}</div>
                <div className="space-y-3 pt-4">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
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


export default function UpgradePage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] w-full items-center justify-center p-4">
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-6xl">
            <div className="flex flex-col justify-center items-start p-8 rounded-lg">
                <div className="text-left">
                    <Link href="/dashboard/clientes" className="text-sm text-muted-foreground hover:text-primary mb-4 block">&larr; Voltar</Link>
                    <h1 className="text-3xl font-bold">Parabéns pelo seu crescimento!</h1>
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
                    />
                </div>
            </div>
             <div className="p-8 space-y-6">
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
    </div>
  )
}

    