
'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Send, FileWarning, ArrowRight, UserPlus, FilePlus, Link2 } from 'lucide-react'
import { getClients } from '@/lib/actions/clients'
import type { Cliente, Profile } from '@/lib/types'
import { format, isAfter, startOfMonth, addMonths } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getProfile } from '@/lib/actions/profile'
import { sendTransactionalEmail } from '@/lib/brevo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link'

interface PendingCharge extends Cliente {
    nextDueDate: Date;
    proposta: any; // Simplificado para evitar erros de tipo complexos
}

export default function CobrancasPage() {
  const [pendingCharges, setPendingCharges] = useState<PendingCharge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState<string | null>(null);
  const [providerProfile, setProviderProfile] = useState<(Profile & {email: string}) | null>(null);
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      // Buscamos clientes que têm uma proposta vinculada e cobrança ativa
      const [{ data: clients, error }, { data: profileData }] = await Promise.all([
        getClients(),
        getProfile()
      ]);

      if (error || !clients) {
        toast({
            variant: 'destructive',
            title: 'Erro ao buscar dados',
            description: error?.message || 'Não foi possível carregar os dados.'
        })
        setIsLoading(false)
        return
      }

      setProviderProfile(profileData as (Profile & { email: string; }) | null);

      const today = new Date();
      const charges: PendingCharge[] = [];

      clients
        .filter(c => c.billing_status === 'active' && c.proposta_id) // Filtra apenas clientes com cobrança ativa e proposta
        .forEach(client => {
            // @ts-ignore
            if (client.propostas && client.propostas.payment_day) {
                // @ts-ignore
                const paymentDay = client.propostas.payment_day;
                let nextDueDate = startOfMonth(today);
                nextDueDate.setDate(paymentDay);

                if (isAfter(today, nextDueDate)) {
                    nextDueDate = addMonths(nextDueDate, 1);
                }
                
                charges.push({
                    ...client,
                    nextDueDate,
                    // @ts-ignore
                    proposta: client.propostas,
                });
            }
        });
      
      setPendingCharges(charges)
      setIsLoading(false)
    }

    fetchData()
  }, [toast])
  
  // Re-fetch dos clientes quando a action for executada
  useEffect(() => {
     async function fetchClientsWithProposals() {
        const {data, error} = await getClients()
        // ... Lógica para atualizar a lista
     }
     // ...
  },[])


  const handleSendCharge = async (charge: PendingCharge) => {
      setIsSending(charge.id);
      const clientName = charge.full_name || charge.company_name;
      const clientEmail = charge.email;
      
      if (!clientEmail) {
          toast({ variant: 'destructive', title: "E-mail não encontrado", description: `O cliente ${clientName} não possui um e-mail cadastrado.` });
          setIsSending(null);
          return;
      }
      
      if (!providerProfile || !providerProfile.email) {
           toast({ variant: 'destructive', title: "Perfil incompleto", description: `Seu perfil ou e-mail de remetente não foram encontrados.` });
           setIsSending(null);
           return;
      }
      
      const senderName = providerProfile.full_name || providerProfile.company_name || 'Seu Assistente Virtual';
      const senderEmail = providerProfile.email; 

      try {
        const BREVO_TEMPLATE_ID = 58; 
        const portalUrl = new URL(`/portal/${charge.id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();

        await sendTransactionalEmail(
            clientEmail,
            BREVO_TEMPLATE_ID,
            {
                nome_cliente: clientName,
                nome_contratada: senderName,
                valor_cobranca: charge.proposta?.value?.toFixed(2),
                data_vencimento: format(charge.nextDueDate, 'dd/MM/yyyy'),
                link_portal: portalUrl,
            },
            senderName,
            senderEmail
        );
        
        toast({
            title: "Cobrança Enviada!",
            description: `Um e-mail de cobrança foi enviado para ${clientName}.`
        });

      } catch (error: any) {
          toast({
              variant: 'destructive',
              title: "Erro ao enviar cobrança",
              description: error.message || "Não foi possível enviar o e-mail."
          })
      } finally {
        setIsSending(null);
      }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Gestão de Cobranças</h1>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Como Funciona a Cobrança?</CardTitle>
                <CardDescription>Siga estes passos para configurar a cobrança para um cliente.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-3">
                <div className="flex items-start gap-4">
                    <UserPlus className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">1. Cadastre o Cliente</h4>
                        <p className="text-sm text-muted-foreground">Adicione um novo cliente na página de <Link href="/dashboard/clientes" className="underline">Clientes</Link>.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <FilePlus className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">2. Crie uma Proposta</h4>
                        <p className="text-sm text-muted-foreground">Defina os valores e datas em <Link href="/dashboard/propostas/nova" className="underline">Propostas</Link>.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Link2 className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">3. Vincule e Ative</h4>
                        <p className="text-sm text-muted-foreground">Na página do cliente, vá na aba "Financeiro", vincule a proposta e ative a cobrança.</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Tabs defaultValue="recorrentes" className="w-full">
            <TabsList>
                <TabsTrigger value="recorrentes">Cobranças Recorrentes</TabsTrigger>
                <TabsTrigger value="historico" disabled>Histórico de Envios (em breve)</TabsTrigger>
            </TabsList>
            <TabsContent value="recorrentes">
                {isLoading ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
                ) : pendingCharges.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                    <div className="flex flex-col items-center gap-1 text-center">
                    <FileWarning className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-2xl font-bold tracking-tight">
                        Nenhuma cobrança recorrente ativa
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Para ver cobranças aqui, certifique-se de que seus clientes têm uma proposta financeira vinculada e o status de cobrança "Ativo".
                    </p>
                    </div>
                </div>
                ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Próximas Cobranças</CardTitle>
                        <CardDescription>
                            Listagem de cobranças recorrentes ativas para o próximo ciclo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="hidden md:table-cell">Proposta Vinculada</TableHead>
                            <TableHead>Valor (R$)</TableHead>
                            <TableHead>Próximo Vencimento</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {pendingCharges.map((charge) => (
                            <TableRow key={charge.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={charge?.avatar_url || ''} alt="Avatar do Cliente" />
                                    <AvatarFallback>{(charge?.full_name || charge?.company_name || 'C').charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{charge?.full_name || charge?.company_name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{charge.proposta?.name || 'N/A'}</TableCell>
                            <TableCell>
                                {charge.proposta?.value ? `${Number(charge.proposta.value).toFixed(2)}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                                {format(charge.nextDueDate, 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell className="text-center">
                                <Button size="sm" onClick={() => handleSendCharge(charge)} disabled={isSending === charge.id}>
                                    {isSending === charge.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Enviar Lembrete
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                )}
            </TabsContent>
            <TabsContent value="historico">
                 <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                    <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                        Em breve
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Aqui você poderá ver o histórico de todos os e-mails de cobrança enviados.
                    </p>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    </div>
  )
}
