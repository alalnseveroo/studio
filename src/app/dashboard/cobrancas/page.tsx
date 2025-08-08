
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, DollarSign, Send, FileWarning } from 'lucide-react'
import { getContracts } from '@/lib/actions/contratos'
import type { Contrato } from '@/lib/types'
import { format, isAfter, startOfMonth, addMonths } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'


interface PendingCharge extends Contrato {
    nextDueDate: Date;
}

export default function CobrancasPage() {
  const [pendingCharges, setPendingCharges] = useState<PendingCharge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()


  useEffect(() => {
    async function fetchPendingCharges() {
      setIsLoading(true)
      const { data: contracts, error } = await getContracts()

      if (error || !contracts) {
        toast({
            variant: 'destructive',
            title: 'Erro ao buscar contratos',
            description: error?.message || 'Não foi possível carregar os dados.'
        })
        setIsLoading(false)
        return
      }

      const today = new Date();
      const charges: PendingCharge[] = [];

      contracts.forEach(contract => {
        // Apenas contratos ativos e com proposta são considerados
        if (contract.status === 'signed_by_client' && contract.propostas?.payment_day) {
           const paymentDay = contract.propostas.payment_day;
           const contractStartDate = new Date(contract.created_at);
           
           // Lógica para determinar o próximo vencimento
           let nextDueDate = startOfMonth(today);
           nextDueDate.setDate(paymentDay);

           // Se o vencimento deste mês já passou, o próximo é no mês que vem
           if (isAfter(today, nextDueDate)) {
               nextDueDate = addMonths(nextDueDate, 1);
           }
            
           // Aqui deveria entrar uma lógica mais complexa para verificar se a cobrança do mês já foi gerada/paga.
           // Por enquanto, vamos adicionar todos os contratos ativos para demonstração.
           charges.push({
               ...contract,
               nextDueDate
           })
        }
      });
      
      setPendingCharges(charges)
      setIsLoading(false)
    }

    fetchPendingCharges()
  }, [toast])

  const handleSendCharge = (charge: PendingCharge) => {
      console.log("Enviando cobrança para:", charge.clientes.email);
      toast({
          title: "Cobrança Enviada!",
          description: `Um e-mail de cobrança foi enviado para ${charge.clientes.full_name || charge.clientes.company_name}.`
      })
      // No futuro, aqui chamaria uma server action para registrar a cobrança e enviar o e-mail
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Gestão de Cobranças</h1>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pendingCharges.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
              <FileWarning className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight">
                Nenhuma cobrança pendente
              </h3>
              <p className="text-sm text-muted-foreground">
                Todos os seus contratos estão em dia ou não há contratos ativos.
              </p>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
                <CardTitle>Cobranças Recorrentes</CardTitle>
                <CardDescription>
                    Listagem de cobranças pendentes para o próximo ciclo de faturamento.
                </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Contrato</TableHead>
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
                              <AvatarImage src={charge.clientes?.avatar_url || ''} alt="Avatar do Cliente" />
                              <AvatarFallback>{(charge.clientes?.full_name || charge.clientes?.company_name || 'C').charAt(0)}</AvatarFallback>
                           </Avatar>
                           <span>{charge.clientes?.full_name || charge.clientes?.company_name}</span>
                         </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{charge.contract_code}</TableCell>
                      <TableCell>
                        {charge.propostas?.value ? `${Number(charge.propostas.value).toFixed(2)}` : 'N/A'}
                      </TableCell>
                       <TableCell>
                        {format(charge.nextDueDate, 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-center">
                         <Button size="sm" onClick={() => handleSendCharge(charge)}>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Cobrança
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
    </div>
  )
}

