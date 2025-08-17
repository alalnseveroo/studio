
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { getProfile } from '@/lib/actions/profile'
import type { Profile } from '@/lib/types'
import { ArrowLeft, CreditCard, Gift, Loader2, Minus, Plus, ShieldCheck, ShoppingCart, Check } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createPixCharge } from '@/lib/asaas'
import { useToast } from '@/hooks/use-toast'
import { PixQRCodeModal, type PixData } from '@/components/pix-qrcode-modal'

const benefitItems = [
    { text: "Gestão de contratos automatizada.", icon: ShieldCheck },
    { text: "Cobranças recorrentes via PIX.", icon: CreditCard },
    { text: "Portal do cliente com sua marca.", icon: Gift }
];

const presetAmounts = [15, 30, 50, 100];

export default function BuyCreditsPage() {
    const [amount, setAmount] = useState(15);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [pixData, setPixData] = useState<PixData | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            const { data } = await getProfile();
            setUserProfile(data as Profile | null);
            setIsLoading(false);
        };
        fetchProfileData();
    }, []);

    const handleAmountChange = (newAmount: number) => {
        const constrainedAmount = Math.max(5, newAmount);
        setAmount(constrainedAmount);
    }
    
    const handlePayment = async () => {
        if (!userProfile?.asaas_customer_id) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'ID de cliente do Asaas não encontrado. Sincronize seu perfil novamente.'
            });
            return;
        }

        setIsProcessingPayment(true);
        try {
            const result = await createPixCharge(userProfile.asaas_customer_id, amount, `Compra de ${amount / 5} créditos`);
            if (result.error) {
                throw new Error(result.error);
            }
            setPixData({
                qrCodeImage: result.encodedImage,
                payload: result.payload,
                value: amount
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao gerar cobrança',
                description: error.message || 'Não foi possível se comunicar com o sistema de pagamentos.'
            });
        } finally {
            setIsProcessingPayment(false);
        }
    }

    if (isLoading) {
        return <div className="flex flex-1 items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <>
            <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-10 animate-fade-in">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon" className="h-7 w-7">
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Voltar</span>
                        </Link>
                    </Button>
                    <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                        Comprar Créditos
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna Direita - Seleção */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quantos créditos deseja comprar?</CardTitle>
                                <CardDescription>Cada R$ 5,00 equivale a 1 crédito para gerenciar 1 cliente por mês.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <Button size="icon" variant="outline" onClick={() => handleAmountChange(amount - 5)} disabled={amount <= 5}>
                                        <Minus className="h-6 w-6" />
                                    </Button>
                                    <div className="text-5xl font-bold tracking-tight w-48 text-center">
                                        <span className="text-3xl text-muted-foreground mr-1">R$</span>{amount.toFixed(2).replace('.', ',')}
                                    </div>
                                    <Button size="icon" variant="outline" onClick={() => handleAmountChange(amount + 5)}>
                                        <Plus className="h-6 w-6" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {presetAmounts.map(val => (
                                        <Button key={val} variant="outline" size="sm" onClick={() => handleAmountChange(val)}>
                                            R$ {val}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Forma de Pagamento</CardTitle>
                                <CardDescription>Escolha como deseja pagar.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <RadioGroupItem value="credit_card" id="credit_card" className="sr-only peer" />
                                    <label
                                        htmlFor="credit_card"
                                        className={cn("flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all", "peer-data-[state=checked]:border-primary peer-data-[state=checked]:shadow-md", "opacity-50 cursor-not-allowed")}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-base">Cartão de Crédito (em breve)</span>
                                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'credit_card' ? "bg-primary border-primary" : "border-muted-foreground")}>
                                                {paymentMethod === 'credit_card' && <Check className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                    </label>
                                    <RadioGroupItem value="pix" id="pix" className="sr-only peer" />
                                    <label
                                        htmlFor="pix"
                                        className={cn("flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all", "peer-data-[state=checked]:border-primary peer-data-[state=checked]:shadow-md")}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-base">PIX</span>
                                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'pix' ? "bg-primary border-primary" : "border-muted-foreground")}>
                                                {paymentMethod === 'pix' && <Check className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                    </label>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button size="lg" className="text-lg py-6" onClick={handlePayment} disabled={isProcessingPayment}>
                                {isProcessingPayment ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Realizar Pagamento'}
                            </Button>
                        </div>
                    </div>

                    {/* Coluna Esquerda - Resumo */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Resumo do Pedido
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {userProfile && (
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={userProfile.avatar_url || ''} />
                                            <AvatarFallback>{(userProfile.full_name || 'U').charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">{userProfile.full_name || userProfile.company_name}</p>
                                            <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                                        </div>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Créditos a adicionar:</span>
                                    <span className="font-semibold">{amount / 5} créditos</span>
                                </div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-muted-foreground">Valor total:</span>
                                    <span className="font-bold">R$ {amount.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold mb-3">Benefícios inclusos:</h4>
                                    <div className="space-y-2">
                                        {benefitItems.map((item, index) => (
                                            <div key={index} className="flex items-center gap-3 text-sm">
                                                <item.icon className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                <span>{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            
            {pixData && (
                <PixQRCodeModal 
                    isOpen={!!pixData}
                    onClose={() => setPixData(null)}
                    pixData={pixData}
                />
            )}
        </>
    )
}
