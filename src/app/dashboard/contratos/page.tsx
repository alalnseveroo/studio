'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, FileSignature } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CreateContractModal } from '@/components/create-contract-modal'
import { getContracts } from '@/lib/actions/contratos'
import { getClients } from '@/lib/actions/clients'
import { getProposals } from '@/lib/actions/propostas'
import type { Contrato, Cliente, Proposta } from '@/lib/types'
import { format } from 'date-fns'

export default function ContratosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [contracts, setContracts] = useState<Contrato[]>([])
  const [clients, setClients] = useState<Cliente[]>([])
  const [proposals, setProposals] = useState<Proposta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const [
        { data: contractsData }, 
        { data: clientsData }, 
        { data: proposalsData }
      ] = await Promise.all([
        getContracts(),
        getClients(),
        getProposals()
      ])
      
      setContracts(contractsData || [])
      setClients(clientsData || [])
      setProposals(proposalsData || [])
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const handleContractAdded = (newContract: Contrato) => {
    setContracts((prev) => [newContract, ...prev])
  }
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary'
      case 'signed_by_provider':
        return 'outline'
      case 'signed_by_client':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho'
      case 'signed_by_provider':
        return 'Aguardando Cliente'
      case 'signed_by_client':
        return 'Assinado'
      default:
        return 'Desconhecido'
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 rounded-lg bg-card p-4 shadow-sm sm:gap-6 sm:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Contratos</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Gerar Contrato
              </span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <p>Carregando contratos...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
              <FileSignature className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight">
                Você ainda não tem contratos
              </h3>
              <p className="text-sm text-muted-foreground">
                Gere seu primeiro contrato para vê-lo aqui.
              </p>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Proposta</TableHead>
                     <TableHead className="hidden md:table-cell">Criado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.contract_code}</TableCell>
                      <TableCell>{contract.clientes?.full_name || contract.clientes?.company_name}</TableCell>
                      <TableCell className="hidden md:table-cell">{contract.propostas?.name}</TableCell>
                       <TableCell className="hidden md:table-cell">
                        {format(new Date(contract.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(contract.status) as any}>
                          {getStatusText(contract.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/contratos/${contract.id}`}>
                            Ver
                          </Link>
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

      <CreateContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onContractAdded={handleContractAdded}
        clients={clients}
        proposals={proposals}
      />
    </>
  )
}