
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ArrowLeft, Loader2, DollarSign, Calendar, FileText, CheckCircle, Edit } from 'lucide-react'
import { getProposals } from '@/lib/actions/propostas' // Vamos reusar a listagem por enquanto
import type { Proposta } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start">
        <Icon className="h-5 w-5 text-muted-foreground mt-1 mr-4" />
        <div className="flex-1">
            <p className="font-semibold">{label}</p>
            <p className="text-sm text-muted-foreground">{value}</p>
        </div>
    </div>
)


export default function PropostaDetailPage() {
  const [proposal, setProposal] = useState<Proposta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const proposalId = params.id as string

  const fetchProposal = useCallback(async () => {
    setIsLoading(true)
    // No momento não temos getProposalById, então vamos filtrar da lista
    const { data } = await getProposals()
    const foundProposal = data?.find(p => p.id === proposalId) || null
    setProposal(foundProposal)
    setIsLoading(false)
  }, [proposalId])

  useEffect(() => {
    fetchProposal()
  }, [fetchProposal])

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!proposal) {
    return (
       <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Proposta não encontrada
          </h3>
          <p className="text-sm text-muted-foreground">
            A proposta que você está procurando não existe ou foi removida.
          </p>
           <Button className="mt-4" onClick={() => router.push('/dashboard/propostas')}>Voltar para Propostas</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex items-center gap-4">
         <Button asChild variant="outline" size="icon" className="h-7 w-7">
            <Link href="/dashboard/propostas">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
            </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Detalhes da Proposta
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="sm" disabled>
                <Edit className="h-3.5 w-3.5 mr-2" /> Editar (em breve)
            </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>{proposal.name}</CardTitle>
                <CardDescription>ID: {proposal.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-4">Serviços Incluídos</h3>
                    <div className="space-y-3">
                        {proposal.services.map((service, index) => (
                            <div key={index} className="flex items-center gap-3 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>{service}</span>
                            </div>
                        ))}
                    </div>
                </div>
                 <Separator />
                 <div>
                    <h3 className="font-semibold mb-4">Termos de Vigência</h3>
                    <div className="space-y-4">
                        <InfoItem 
                            icon={Calendar} 
                            label="Duração do Contrato" 
                            value={proposal.contract_duration_type === 'definite' ? `${proposal.contract_duration_months} meses` : 'Prazo Indeterminado'} 
                        />
                        <InfoItem 
                            icon={Calendar} 
                            label="Início da Vigência" 
                            value={proposal.start_date ? format(new Date(proposal.start_date), 'dd/MM/yyyy') : 'Não definido'} 
                        />
                        {proposal.contract_duration_type === 'definite' && (
                            <InfoItem 
                                icon={Calendar} 
                                label="Término da Vigência" 
                                value={proposal.end_date ? format(new Date(proposal.end_date), 'dd/MM/yyyy') : 'Não definido'} 
                            />
                        )}
                         <InfoItem 
                            icon={FileText} 
                            label="Foro" 
                            value={`${proposal.jurisdiction_city || 'Não definida'}, ${proposal.jurisdiction_state || 'UF'}`} 
                        />
                    </div>
                 </div>
            </CardContent>
          </Card>

           <Card>
                <CardHeader>
                    <CardTitle>Financeiro</CardTitle>
                    <CardDescription>Detalhes de pagamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <InfoItem 
                        icon={DollarSign} 
                        label="Tipo de Remuneração" 
                        value={
                            proposal.payment_type === 'fixed' ? 'Valor Fixo Mensal' :
                            proposal.payment_type === 'hourly' ? 'Valor por Hora' : 'Valor por Projeto'
                        }
                    />
                    <InfoItem 
                        icon={DollarSign} 
                        label="Valor" 
                        value={`R$ ${proposal.value?.toFixed(2) || '0.00'}`} 
                    />
                     <InfoItem 
                        icon={Calendar} 
                        label="Dia do Vencimento" 
                        value={`Todo dia ${proposal.payment_day}`}
                    />
                     <InfoItem 
                        icon={FileText} 
                        label="Método de Pagamento" 
                        value={proposal.payment_method || 'Não definido'}
                    />
                </CardContent>
           </Card>
      </div>

    </div>
  )
}
