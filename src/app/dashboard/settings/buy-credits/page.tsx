
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { getProfile } from '@/lib/actions/profile'
import type { Profile } from '@/lib/types'
import { ArrowLeft, CreditCard, Gift, Loader2, Minus, Plus, ShieldCheck, ShoppingCart, Check, CheckCircle, FileText, Globe, BarChart3, Star, Copy, Info, Users } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createPixCharge } from '@/lib/asaas'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import QRCode from "qrcode.react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'


const benefitItems = [
    { text: "Contratos ilimitados", icon: FileText, tooltip: "Crie quantos contratos desejar, e seu crédito será deduzido se ele for assinado." },
    { text: "Cobrança automática", icon: ShieldCheck },
    { text: "Recorrência via PIX", icon: CreditCard },
    { text: "Portal do cliente com sua marca", icon: Gift },
    { text: "Perfil exposto no Google", icon: Globe },
    { text: "Controle do seu negócio", icon: Star },
    { text: "E-mail marketing (em breve)", icon: Star, isFuture: true },
    { text: "Nota fiscal automática (em breve)", icon: BarChart3, isFuture: true },
];

const presetOptions = [
    { label: '1 cliente', value: 7 },
    { label: '3 clientes', value: 21 },
    { label: '5 clientes', value: 35 },
    { label: '10 clientes', value: 70 },
]

interface PixData {
  qrCodeImage: string;
  payload: string;
  value: number;
}

export default function BuyCreditsPage() {
    const [amount, setAmount] = useState(7);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [userProfile, setUserProfile] = useState<Profile & { email?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [pixData, setPixData] = useState<PixData | null>(null);
    const [showPix, setShowPix] = useState(false);
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            const { data } = await getProfile();
            setUserProfile(data as Profile & { email?: string } | null);
            setIsLoading(false);
        };
        fetchProfileData();
    }, []);

    const handleAmountChange = (newAmount: number) => {
        const constrainedAmount = Math.max(7, newAmount);
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
            const creditsToBuy = Math.floor(amount / 7);
            const result = await createPixCharge(userProfile.asaas_customer_id, amount, `Compra de ${creditsToBuy} crédito(s)`);
            if (result.error) {
                throw new Error(result.error);
            }
            setPixData({
                qrCodeImage: result.encodedImage,
                payload: result.payload,
                value: amount
            });
            setShowPix(true);
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

     const handleCopy = () => {
        if (!pixData) return;
        navigator.clipboard.writeText(pixData.payload);
        setIsCopied(true);
        toast({
        title: "Código Copiado!",
        description: "O código PIX Copia e Cola foi copiado para a área de transferência.",
        });
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (isLoading) {
        return <div className="flex flex-1 items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    const credits = Math.floor(amount / 7);

    const SummaryCard = () => (
         <Card className="sticky top-24">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="h-5 w-5" />
                    Resumo do Pedido
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {userProfile && userProfile.email && (
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
                <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">Valor total:</span>
                    <span className="font-bold">R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div>
                    <h4 className="font-semibold mb-3 text-base">Benefícios inclusos:</h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                            <Users className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>{credits} cliente{credits !== 1 ? 's' : ''} ativo{credits !== 1 ? 's' : ''}</span>
                        </div>
                        {benefitItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 text-sm">
                                <item.icon className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>{item.text}</span>
                                 {item.tooltip && (
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-50 hover:opacity-100"><Info className="h-4 w-4" /></Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>{item.tooltip}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                 )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex flex-1 justify-center p-4 sm:p-6 md:p-10 animate-in fade-in-50 duration-500 overflow-x-hidden">
            <div className="w-full max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 items-start">
                    
                    {/* --- COLUNA DA ESQUERDA (Seleção ou Resumo) --- */}
                    <div className={cn("transition-all duration-500 ease-in-out", showPix ? "opacity-100" : "opacity-100")}>
                        {showPix ? (
                           <SummaryCard />
                        ) : (
                             <div className="space-y-8">
                                <div className="space-y-2 relative">
                                    <div className="absolute -top-6 -left-4">
                                        <Button asChild variant="ghost" size="icon">
                                            <Link href="/dashboard/settings/profile">
                                                <ArrowLeft className="h-5 w-5"/>
                                                <span className="sr-only">Voltar</span>
                                            </Link>
                                        </Button>
                                    </div>
                                    <h1 className="text-2xl font-bold">Obtenha créditos</h1>
                                    <p className="text-muted-foreground">Você compra crédito agora, mas ele só é deduzido quando houver sucesso garantido: contrato assinado ou cobrança recorrente ativa.</p>
                                </div>
                                
                                <div className="flex flex-col items-start gap-6">
                                    <div className="flex items-center gap-4 w-full justify-start">
                                        <div className="text-left">
                                            <div className="text-5xl font-bold tracking-tight">
                                                <span className="text-3xl text-muted-foreground mr-1">R$</span>{amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="icon" variant="outline" className="rounded-full h-8 w-8" onClick={() => handleAmountChange(amount + 7)}>
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                            <Button size="icon" variant="outline" className="rounded-full h-8 w-8" onClick={() => handleAmountChange(amount - 7)} disabled={amount <= 7}>
                                                <Minus className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-start gap-2 w-full">
                                        {presetOptions.map((opt) => (
                                            <Button key={opt.value} variant="outline" size="sm" onClick={() => handleAmountChange(opt.value)} className="bg-muted hover:bg-muted/80 rounded-full">
                                                {opt.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <h2 className="text-lg font-semibold mb-4">Forma de Pagamento</h2>
                                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4 max-w-xs">
                                        <label
                                            htmlFor="pix"
                                            className={cn(
                                                "flex flex-col justify-between rounded-lg border-2 p-4 cursor-pointer transition-all aspect-square relative",
                                                paymentMethod === 'pix' ? "border-green-500 shadow-md" : "border-border"
                                            )}
                                        >
                                            <RadioGroupItem value="pix" id="pix" className="sr-only peer" />
                                            <div className="absolute top-3 right-3">
                                                <div className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", paymentMethod === 'pix' ? "border-green-500 bg-green-500" : "border-muted-foreground")}>
                                                    {paymentMethod === 'pix' && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                            </div>
                                            <div>
                                                <ShieldCheck className="h-8 w-8 mb-2" />
                                                <span className="font-bold text-base">PIX</span>
                                                <p className="text-xs text-muted-foreground mt-1">Aprovação imediata.</p>
                                            </div>
                                        </label>
                                        <label
                                            htmlFor="credit_card"
                                            className={cn(
                                                "flex flex-col justify-between rounded-lg border-2 p-4 cursor-pointer transition-all opacity-50 cursor-not-allowed aspect-square relative",
                                                paymentMethod === 'credit_card' ? "border-green-500 shadow-md" : "border-border"
                                            )}
                                        >
                                            <RadioGroupItem value="credit_card" id="credit_card" className="sr-only peer" disabled/>
                                            <div className="absolute top-3 right-3">
                                                <div className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", paymentMethod === 'credit_card' ? "border-green-500 bg-green-500" : "border-muted-foreground")}>
                                                    {paymentMethod === 'credit_card' && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                            </div>
                                            <div>
                                                <CreditCard className="h-8 w-8 mb-2" />
                                                <span className="font-bold text-base">Cartão de Crédito</span>
                                                <p className="text-xs text-muted-foreground mt-1">Em breve.</p>
                                            </div>
                                        </label>
                                    </RadioGroup>
                                </div>
                                
                                <div className="pt-4">
                                    <Button size="lg" className="text-lg py-6" onClick={handlePayment} disabled={isProcessingPayment}>
                                        {isProcessingPayment ? <Loader2 className="h-6 w-6 animate-spin" /> : `Comprar ${credits} crédito(s)`}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* --- COLUNA DA DIREITA (Resumo ou PIX) --- */}
                     <div className={cn("transition-all duration-500 ease-in-out", showPix ? "opacity-100" : "opacity-100")}>
                        {showPix ? (
                           pixData && (
                                <div className="flex flex-col items-center gap-4 py-4 text-center">
                                    <h2 className="text-xl font-bold">Pague com PIX</h2>
                                    <p className="text-muted-foreground max-w-xs">Abra o app do seu banco e escaneie o QR Code ou use o código abaixo.</p>
                                    <div className="p-2 bg-white rounded-lg border mt-4">
                                        <Image
                                          src={`data:image/png;base64,${pixData.qrCodeImage}`}
                                          alt="PIX QR Code"
                                          width={220}
                                          height={220}
                                        />
                                    </div>
                                    <div className="w-full max-w-sm space-y-2 mt-4">
                                        <p className="text-sm font-medium text-center">PIX Copia e Cola</p>
                                        <div className="relative">
                                            <textarea
                                                readOnly
                                                value={pixData.payload}
                                                className="w-full p-2 pr-10 text-xs border rounded-md bg-muted text-muted-foreground h-20 resize-none"
                                            />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
                                                onClick={handleCopy}
                                            >
                                                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : (
                           <SummaryCard />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
