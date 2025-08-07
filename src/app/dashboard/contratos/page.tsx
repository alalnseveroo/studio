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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, FileSignature, Loader2, Eye, MoreVertical, Send, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CreateContractModal } from '@/components/create-contract-modal'
import { getContracts } from '@/lib/actions/contratos'
import { getClients } from '@/lib/actions/clients'
import { getProposals } from '@/lib/actions/propostas'
import type { Contrato, Cliente, Proposta } from '@/lib/types'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export default function ContratosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [contracts, setContracts] = useState<Contrato[]>([])
  const [clients, setClients] = useState<Cliente[]>([])
  const [proposals, setProposals] = useState<Proposta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedContracts, setSelectedContracts] = useState<string[]>([])

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
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'signed_by_client':
        return 'border-green-500 bg-green-500/10 text-green-700' // Finalizado
      case 'signed_by_provider':
        return 'border-orange-500 bg-orange-500/10 text-orange-700' // Aguardando Cliente
      case 'draft':
        return 'border-gray-500 bg-gray-500/10 text-gray-700' // Rascunho
      default:
        return 'border-gray-500 bg-gray-500/10 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho'
      case 'signed_by_provider':
        return 'Aguardando Cliente'
      case 'signed_by_client':
        return 'Finalizado'
      default:
        return 'Desconhecido'
    }
  }
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContracts(contracts.map((contract) => contract.id));
    } else {
      setSelectedContracts([]);
    }
  };

  const handleSelectContract = (contractId: string, checked: boolean) => {
    if (checked) {
      setSelectedContracts((prev) => [...prev, contractId]);
    } else {
      setSelectedContracts((prev) => prev.filter((id) => id !== contractId));
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
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
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
               <Button className="mt-4" onClick={() => setIsModalOpen(true)}>Gerar Contrato</Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[60px] border-r">
                       <Checkbox
                        checked={selectedContracts.length > 0 && selectedContracts.length === contracts.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead className="w-[100px] border-r">Código</TableHead>
                    <TableHead className="border-r">Cliente</TableHead>
                    <TableHead className="border-r hidden md:table-cell">Proposta</TableHead>
                    <TableHead className="border-r hidden lg:table-cell">Valor</TableHead>
                    <TableHead className="border-r hidden lg:table-cell">Criado em</TableHead>
                    <TableHead className="border-r hidden md:table-cell">Status</TableHead>
                    <TableHead className="w-[100px] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id} className="h-12" data-state={selectedContracts.includes(contract.id) ? 'selected' : ''}>
                       <TableCell className="py-1 border-r">
                         <Checkbox
                          checked={selectedContracts.includes(contract.id)}
                          onCheckedChange={(checked) => handleSelectContract(contract.id, !!checked)}
                          aria-label={`Selecionar contrato ${contract.contract_code}`}
                        />
                      </TableCell>
                      <TableCell className="py-1 border-r font-medium">{contract.contract_code}</TableCell>
                      <TableCell className="font-medium py-1 border-r">
                         <div className="flex items-center gap-3">
                           <Avatar className="h-8 w-8">
                              <AvatarImage src={contract.clientes?.avatar_url || ''} alt="Avatar do Cliente" />
                              <AvatarFallback>{contract.clientes?.full_name ? contract.clientes.full_name.charAt(0) : 'C'}</AvatarFallback>
                           </Avatar>
                           <span>{contract.clientes?.full_name || contract.clientes?.company_name}</span>
                         </div>
                      </TableCell>
                      <TableCell className="py-1 border-r hidden md:table-cell">{contract.propostas?.name}</TableCell>
                      <TableCell className="py-1 border-r hidden lg:table-cell">
                        {contract.propostas?.value ? `R$ ${Number(contract.propostas.value).toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell className="hidden py-1 border-r lg:table-cell">
                        {format(new Date(contract.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="hidden py-1 border-r md:table-cell">
                        <Badge variant="outline" className={cn("font-normal", getStatusClass(contract.status))}>
                          {getStatusText(contract.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                            <Button asChild variant="outline" size="icon" className="h-8 w-8">
                                <Link href={`/dashboard/contratos/${contract.id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Ver</span>
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Send className="mr-2 h-4 w-4" />
                                      Reenviar E-mail
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
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

    