

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { PlusCircle, FileText, CheckCircle } from 'lucide-react'
import { getProposals } from '@/lib/actions/propostas'
import type { Proposta } from '@/lib/types'

export default function PropostasPage() {
  const [proposals, setProposals] = useState<Proposta[]>([])

  useEffect(() => {
    async function fetchProposals() {
      const { data } = await getProposals()
      setProposals(data || [])
    }
    fetchProposals()
  }, [])


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-10">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Minhas Propostas</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" className="h-8 gap-1">
            <Link href="/dashboard/propostas/nova">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Criar Nova Proposta
                </span>
            </Link>
          </Button>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-2xl font-bold tracking-tight">
              Você ainda não tem propostas
            </h3>
            <p className="text-sm text-muted-foreground">
              Crie propostas de serviço para usar em seus contratos e cobranças.
            </p>
             <Button className="mt-4" asChild>
                <Link href="/dashboard/propostas/nova">Criar Proposta</Link>
             </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader>
                <CardTitle className="truncate">{proposal.name}</CardTitle>
                <CardDescription>
                  {proposal.services.length} serviço(s) incluído(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {proposal.services.slice(0, 3).map((service, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm truncate">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{service}</span>
                    </div>
                  ))}
                  {proposal.services.length > 3 && (
                    <p className="text-sm text-muted-foreground">e mais {proposal.services.length - 3}...</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                 <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/propostas/${proposal.id}`}>
                        Ver Detalhes
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
