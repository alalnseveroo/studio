

'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, FileSignature, Eye, MoreVertical, Send, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CreateContractModal } from '@/components/create-contract-modal'
import { getContracts, deleteMultipleContracts } from '@/lib/actions/contratos'
import { getClients } from '@/lib/actions/clients'
import { getProposals } from '@/lib/actions/propostas'
import { getProfile } from '@/lib/actions/profile'
import type { Contrato, Cliente, Proposta, Profile } from '@/lib/types'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

function ContractsTableSkeleton() {
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                             <TableHead className="w-[60px]"><Skeleton className="h-5 w-5" /></TableHead>
                             <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                             <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                             <TableHead className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableHead>
                             <TableHead className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableHead>
                             <TableHead className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableHead>
                             <TableHead className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableHead>
                             <TableHead className="w-[100px] text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i} className="h-12">
                                <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                                <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-28 rounded-md" /></TableCell>
                                <TableCell><div className="flex justify-center gap-1"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function ContratosPageComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [contracts, setContracts] = useState<Contrato[]>([])
  const [clients, setClients] = useState<Cliente[]>([])
  const [proposals, setProposals] = useState<Proposta[]>([])
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('desc')
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true);
  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    const [
      { data: contractsData }, 
      { data: clientsData }, 
      { data: proposalsData },
      { data: profileData }
    ] = await Promise.all([
      getContracts(),
      getClients(),
      getProposals(),
      getProfile()
    ])
    
    setContracts(contractsData || [])
    setClients(clientsData || [])
    setProposals(proposalsData || [])
    setProfile(profileData as Profile | null);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const handleContractAdded = (newContract: Contrato) => {
    setContracts((prev) => [newContract, ...prev])
  }
  
  const handleBulkDelete = async () => {
    if (selectedContracts.length === 0) return

    const { error } = await deleteMultipleContracts(selectedContracts)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Excluir Contratos',
        description: error.message,
      })
    } else {
      toast({
        title: 'Contratos Excluídos!',
        description: `${selectedContracts.length} contratos foram removidos com sucesso.`,
      })
      await fetchAllData() // Refetch all data
      setSelectedContracts([]) // Clear selection
    }
    setIsBulkDeleteConfirmOpen(false)
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

  const filteredAndSortedContracts = useMemo(() => {
    return contracts
      .filter(contract => statusFilter === 'all' || contract.status === statusFilter)
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      })
  }, [contracts, statusFilter, sortOrder])
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContracts(filteredAndSortedContracts.map((contract) => contract.id));
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
      <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-10">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Contratos</h1>
          <div className="ml-auto flex items-center gap-2">
            {selectedContracts.length > 0 && (
                 <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => setIsBulkDeleteConfirmOpen(true)}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Excluir ({selectedContracts.length})
                    </span>
                </Button>
            )}
            <Button size="sm" className="h-8 gap-1" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Gerar Contrato
              </span>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="signed_by_provider">Aguardando Cliente</SelectItem>
                    <SelectItem value="signed_by_client">Finalizado</SelectItem>
                </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por data" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="desc">Mais Recentes</SelectItem>
                    <SelectItem value="asc">Mais Antigos</SelectItem>
                </SelectContent>
            </Select>
        </div>


        {isLoading ? <ContractsTableSkeleton /> : filteredAndSortedContracts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
            <div className="flex flex-col items-center gap-1 text-center">
              <FileSignature className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight">
                Nenhum contrato encontrado
              </h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'all' ? 'Gere seu primeiro contrato para vê-lo aqui.' : 'Nenhum contrato corresponde ao filtro selecionado.'}
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
                    <TableHead className="w-[60px]">
                       <Checkbox
                        checked={selectedContracts.length > 0 && selectedContracts.length === filteredAndSortedContracts.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead className="w-[100px]">Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Proposta</TableHead>
                    <TableHead className="hidden lg:table-cell">Valor</TableHead>
                    <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="w-[100px] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedContracts.map((contract) => (
                    <TableRow key={contract.id} className="h-12" data-state={selectedContracts.includes(contract.id) ? 'selected' : ''}>
                       <TableCell className="py-1">
                         <Checkbox
                          checked={selectedContracts.includes(contract.id)}
                          onCheckedChange={(checked) => handleSelectContract(contract.id, !!checked)}
                          aria-label={`Selecionar contrato ${contract.contract_code}`}
                        />
                      </TableCell>
                      <TableCell className="py-1 font-medium">{contract.contract_code}</TableCell>
                      <TableCell className="font-medium py-1">
                         <div className="flex items-center gap-3">
                           <Avatar className="h-6 w-6">
                              <AvatarImage src={contract.clientes?.avatar_url || ''} alt="Avatar do Cliente" />
                              <AvatarFallback>{(contract.clientes?.full_name || contract.clientes?.company_name || 'C').charAt(0)}</AvatarFallback>
                           </Avatar>
                           <span>{contract.clientes?.full_name || contract.clientes?.company_name}</span>
                         </div>
                      </TableCell>
                      <TableCell className="py-1 hidden md:table-cell">{contract.propostas?.name}</TableCell>
                      <TableCell className="py-1 hidden lg:table-cell">
                        {contract.propostas?.value ? `R$ ${Number(contract.propostas.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                      </TableCell>
                      <TableCell className="hidden py-1 lg:table-cell">
                        {isClientSide ? format(new Date(contract.created_at), 'dd/MM/yyyy') : ''}
                      </TableCell>
                      <TableCell className="hidden py-1 md:table-cell">
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
                                    <DropdownMenuItem className="text-destructive" onSelect={() => {
                                        setSelectedContracts([contract.id])
                                        setIsBulkDeleteConfirmOpen(true)
                                    }}>
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
        profile={profile}
        onClientListChange={setClients}
      />
      
       <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o(s) <strong>{selectedContracts.length} contrato(s) selecionado(s)</strong>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleBulkDelete}
                className={cn(buttonVariants({ variant: "destructive" }))}
            >
                Sim, excluir contrato(s)
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function ContratosPage() {
    return (
        <Suspense fallback={<ContractsTableSkeleton />}>
            <ContratosPageComponent />
        </Suspense>
    )
}
