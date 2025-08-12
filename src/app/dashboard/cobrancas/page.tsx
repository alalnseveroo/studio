
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
import { format, isAfter, startOfMonth, addMonths, parseISO } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { sendTransactionalEmail } from '@/lib/brevo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PendingCharge extends Cliente {
    nextDueDate: Date;
    proposta: any; 
}

export default function CobrancasPage() {
  const [pendingCharges, setPendingCharges] = useState<PendingCharge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState<string | null>(null);
  const { toast } = useToast()

  const getStatusInfo = (charge: Cliente) => {
    if (charge.billing_status === 'pending_approval') {
        return { text: 'Aguardando Aprovação', className: 'border-orange-500 bg-orange-500/10 text-orange-700' };
    }
    if (charge.billing_status === 'active') {
        return { text: 'Ativa', className: 'border-green-500 bg-green-500/10 text-green-700' };
    }
    return { text: 'Inativa', className: 'border-gray-500 bg-gray-500/10 text-gray-700' };
  }


  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const { data: clients, error } = await getClients();

      if (error || !clients) {
        toast({
            variant: 'destructive',
            title: 'Erro ao buscar dados',
            description: error?.message || 'Não foi possível carregar os dados.'
        })
        setIsLoading(false)
        return
      }

      const today = new Date();
      const charges: PendingCharge[] = [];

      clients
        .forEach(client => {
            const firstChargeDate = client.first_charge_date ? parseISO(client.first_charge_date) : null;
            
            if (client.billing_status === 'pending_approval' && firstChargeDate) {
                charges.push({ ...client, nextDueDate: firstChargeDate, proposta: {} });
            } else if (client.billing_status === 'active' && client.payment_day && firstChargeDate) {
                let nextDueDate = startOfMonth(today);
                nextDueDate.setDate(client.payment_day);
                
                if (isAfter(today, nextDueDate)) {
                    nextDueDate = addMonths(nextDueDate, 1);
                }

                // Se a proxima data de vencimento for antes da data da primeira cobrança, use a data da primeira cobrança
                if (isAfter(firstChargeDate, nextDueDate)) {
                    nextDueDate = firstChargeDate;
                }
                
                charges.push({ ...client, nextDueDate, proposta: { value: client.value } });
            }
        });
      
      setPendingCharges(charges.sort((a,b) => a.nextDueDate.getTime() - b.nextDueDate.getTime()));
      setIsLoading(false)
    }

    fetchData()
  }, [toast])


  const handleSendCharge = async (charge: PendingCharge) => {
      setIsSending(charge.id);
      const clientName = charge.full_name || charge.company_name;
      const clientEmail = charge.email;
      
      if (!clientEmail) {
          toast({ variant: 'destructive', title: "E-mail não encontrado", description: `O cliente ${clientName} não possui um e-mail cadastrado.` });
          setIsSending(null);
          return;
      }
      
      const portalUrl = new URL(`/portal/${charge.id}`, process.env.NEXT_PUBLIC_SITE_URL).toString();
      
      const BREVO_TEMPLATE_ID = 61;

      try {
        await sendTransactionalEmail(
            clientEmail,
            BREVO_TEMPLATE_ID,
            {
                NOME_CLIENTE: clientName,
                VALOR_COBRANCA: (charge.proposta?.value || charge.value || 0).toFixed(2),
                DATA_VENCIMENTO: format(charge.nextDueDate, 'dd/MM/yyyy'),
                LINK_PORTAL: portalUrl,
            },
            charge.user_id // Passando o ID do usuário para a função
        );
        
        toast({
            title: "E-mail de Cobrança Enviado!",
            description: `Um e-mail foi enviado para ${clientName}.`
        });

      } catch (error: any) {
          toast({
              variant: 'destructive',
              title: "Erro ao enviar e-mail",
              description: error.message || "Não foi possível enviar o e-mail."
          })
      } finally {
        setIsSending(null);
      }
  }

  const renderActionButton = (charge: PendingCharge) => {
      const buttonText = charge.billing_status === 'pending_approval' ? 'Revisar e Enviar' : 'Enviar Lembrete';
      return (
          <Button size="sm" onClick={() => handleSendCharge(charge)} disabled={isSending === charge.id}>
              {isSending === charge.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {buttonText}
          </Button>
      )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Gestão de Cobranças</h1>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Como Funciona a Cobrança?</CardTitle>
                <CardDescription>Siga os passos no botão "Adicionar Cliente" para criar uma nova cobrança.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-3">
                <div className="flex items-start gap-4">
                    <UserPlus className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">1. Cadastre o Cliente</h4>
                        <p className="text-sm text-muted-foreground">Adicione um novo cliente e preencha seus dados básicos.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <FilePlus className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">2. Defina a Cobrança</h4>
                        <p className="text-sm text-muted-foreground">Use uma proposta ou defina um valor e data de início.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Link2 className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">3. Revise e Ative</h4>
                        <p className="text-sm text-muted-foreground">Confirme os dados e ative a automação, que aparecerá aqui.</p>
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
                        Clique em "Adicionar Cliente" na página de Clientes para configurar uma nova cobrança.
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
                            <TableHead className="hidden md:table-cell">Status</TableHead>
                            <TableHead>Próxima Cobrança</TableHead>
                            <TableHead>Valor (R$)</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {pendingCharges.map((charge) => {
                          const status = getStatusInfo(charge);
                          return (
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
                            <TableCell className="hidden md:table-cell">
                                <Badge variant="outline" className={cn("font-normal", status.className)}>{status.text}</Badge>
                            </TableCell>
                            <TableCell>
                                {charge.nextDueDate ? format(charge.nextDueDate, 'dd/MM/yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell>
                                {charge.value ? `${Number(charge.value).toFixed(2)}` : 'N/A'}
                            </TableCell>
                            <TableCell className="text-center">
                                {renderActionButton(charge)}
                            </TableCell>
                            </TableRow>
                         )
                        })}
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
