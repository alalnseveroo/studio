
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Checkbox } from "@/components/ui/checkbox"
import { AddClientSheet } from '@/components/add-client-sheet'
import { getClients, deleteClient, deleteMultipleClients } from '@/lib/actions/clients'
import type { Cliente, Proposta, Profile, Contrato } from '@/lib/types'
import { getProposals } from '@/lib/actions/propostas'
import { getContracts } from '@/lib/actions/contratos'
import { getProfile } from '@/lib/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { PlusCircle, Loader2, FilePen, Trash2, Check, FileText, CreditCard, Clock, Link2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { CreateContractModal } from '@/components/create-contract-modal'
import { ConfigureBillingModal } from '@/components/configure-billing-modal'
import { CreateContractTooltip } from '@/components/create-contract-tooltip'


const ITEMS_PER_PAGE = 10;

const CardAction = ({ icon: Icon, title, description, onClick }: { icon: React.ElementType, title: string, description: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="flex items-start gap-4 rounded-lg border p-4 text-left text-sm transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
    >
        <Icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
        <div className="flex-1">
            <p className="font-semibold">{title}</p>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </button>
);


export default function ClientesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false)
  
  const [clients, setClients] = useState<Cliente[]>([])
  const [proposals, setProposals] = useState<Proposta[]>([])
  const [contracts, setContracts] = useState<Contrato[]>([])
  const [profile, setProfile] = useState<Profile | null>(null);

  const [currentPage, setCurrentPage] = useState(1)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null)
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newlyCreatedClient, setNewlyCreatedClient] = useState<Cliente | null>(null);
  const [clientForContract, setClientForContract] = useState<Cliente | null>(null);
  const [clientForBilling, setClientForBilling] = useState<Cliente | null>(null);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);

  const router = useRouter()
  const { toast } = useToast()

  const fetchInitialData = async () => {
    const [{ data: clientData }, { data: proposalData }, { data: profileData }, { data: contractsData }] = await Promise.all([
      getClients(),
      getProposals(),
      getProfile(),
      getContracts()
    ]);
    setClients(clientData || [])
    setProposals(proposalData || [])
    setContracts(contractsData || []);
    setProfile(profileData as Profile | null);
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  const handleCopyLink = (clientId: string) => {
    const portalUrl = new URL(`/portal/${clientId}`, window.location.origin).toString();
    navigator.clipboard.writeText(portalUrl);
    toast({
      title: "Link Copiado!",
      description: "O link do portal do cliente foi copiado para a área de transferência.",
    });
    setCopiedClientId(clientId);
    setTimeout(() => setCopiedClientId(null), 2000);
  };

  const handleAddClientClick = () => {
    setIsSheetOpen(true);
  };
  
  const handleDeleteClient = async () => {
    if (!clientToDelete) return

    const { error } = await deleteClient(clientToDelete.id)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Excluir',
        description: error.message,
      })
    } else {
      toast({
        title: 'Cliente Excluído!',
        description: 'O cliente foi removido com sucesso.',
      })
      await fetchInitialData()
      setSelectedClients([])
    }
    setClientToDelete(null)
  }

  const handleBulkDelete = async () => {
    if (selectedClients.length === 0) return

    const { error } = await deleteMultipleClients(selectedClients)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Excluir',
        description: error.message,
      })
    } else {
      toast({
        title: 'Clientes Excluídos!',
        description: `${selectedClients.length} clientes foram removidos com sucesso.`,
      })
      await fetchInitialData()
      setSelectedClients([])
    }
    setIsBulkDeleteConfirmOpen(false)
  }


  const handleClientAdded = (newClient: Cliente) => {
    fetchInitialData();
    setIsSheetOpen(false);
    setNewlyCreatedClient(newClient);
    setShowSuccessModal(true);
  };
  
  const handleSuccessAction = (action: 'contract' | 'billing') => {
      setShowSuccessModal(false);
      if (!newlyCreatedClient) return;
  
      if (action === 'contract') {
          openContractModalForClient(newlyCreatedClient);
      } else {
          openBillingModalForClient(newlyCreatedClient);
      }
  };
  
  const totalPages = Math.ceil(clients.length / ITEMS_PER_PAGE);
  const paginatedClients = clients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(paginatedClients.map((client) => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectClient = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients((prev) => [...prev, clientId]);
    } else {
      setSelectedClients((prev) => prev.filter((id) => id !== clientId));
    }
  };

  const getContractStatusInfo = (clientContracts: Contrato[]) => {
      if (clientContracts.length === 0) {
        return { text: 'Inativo', className: 'border-gray-500 bg-gray-500/10 text-gray-700' };
      }
      const hasPending = clientContracts.some(c => c.status === 'signed_by_provider');
      if (hasPending) {
        return { text: 'Aguard. Cliente', className: 'border-orange-500 bg-orange-500/10 text-orange-700' };
      }
      const hasActive = clientContracts.some(c => c.status === 'signed_by_client');
      if (hasActive) {
        return { text: 'Ativo', className: 'border-green-500 bg-green-500/10 text-green-700' };
      }
      return { text: 'Rascunho', className: 'border-gray-500 bg-gray-500/10 text-gray-700' };
  }

  const openContractModalForClient = (client: Cliente) => {
    if (profile && profile.credits <= 0) {
        router.push('/dashboard/settings/buy-credits');
        return;
    }
    setClientForContract(client);
    setIsContractModalOpen(true);
  }

  const openBillingModalForClient = (client: Cliente) => {
    setClientForBilling(client);
    setIsBillingModalOpen(true);
  }


  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-10">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Clientes</h1>
          <div className="ml-auto flex items-center gap-2">
            {selectedClients.length > 0 && (
                <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => setIsBulkDeleteConfirmOpen(true)}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Excluir ({selectedClients.length})
                    </span>
                </Button>
            )}
            <Button size="sm" className="h-8 gap-1" onClick={handleAddClientClick} disabled={!profile}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Adicionar Cliente
              </span>
            </Button>
          </div>
        </div>

        {clients.length === 0 ? (
           <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                Você ainda não tem clientes
              </h3>
              <p className="text-sm text-muted-foreground">
                Comece a adicionar clientes para vê-los aqui.
              </p>
               <Button className="mt-4" onClick={handleAddClientClick}>Adicionar Cliente</Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Desktop View - Table */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[60px] border-r">
                      <Checkbox
                        checked={selectedClients.length > 0 && selectedClients.length === paginatedClients.length && paginatedClients.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead className="border-r">Cliente</TableHead>
                    <TableHead className="hidden lg:table-cell border-r">E-mail</TableHead>
                    <TableHead className="w-[120px] border-r">Contrato</TableHead>
                    <TableHead className="w-[100px] border-r">Status</TableHead>
                    <TableHead className="w-[120px] border-r text-center">Portal</TableHead>
                    <TableHead className="w-[120px] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => {
                     const clientContracts = contracts.filter(c => c.cliente_id === client.id);
                     const status = getContractStatusInfo(clientContracts);
                    return (
                        <TableRow key={client.id} data-state={selectedClients.includes(client.id) ? 'selected' : ''} className="h-12">
                          <TableCell className="py-1 border-r">
                            <Checkbox
                              checked={selectedClients.includes(client.id)}
                              onCheckedChange={(checked) => handleSelectClient(client.id, !!checked)}
                              aria-label={`Selecionar cliente ${client.full_name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium py-1 border-r">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-6 w-6">
                                  <AvatarImage src={client.avatar_url || ''} alt="Avatar do Cliente" />
                                  <AvatarFallback>{(client.full_name || client.company_name || 'C').charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{client.full_name || client.company_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell py-1 border-r">{client.email || 'Não informado'}</TableCell>
                          <TableCell className="py-1 border-r">
                             <div className="flex items-center gap-2">
                                {clientContracts.length > 0 ? (
                                   <Link href={`/dashboard/contratos/${clientContracts[0].id}`} className="text-sm hover:underline">{clientContracts[0].contract_code}</Link>
                                ) : (
                                   <CreateContractTooltip client={client} onOpenCreateContractModal={() => openContractModalForClient(client)} />
                                )}
                             </div>
                          </TableCell>
                          <TableCell className="py-1 border-r">
                            <Badge variant="outline" className={cn("font-normal", status.className)}>{status.text}</Badge>
                          </TableCell>
                          <TableCell className="py-1 border-r text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                <Link href={`/portal/${client.id}`} target="_blank">
                                  <Link2 className="h-4 w-4" />
                                  <span className="sr-only">Abrir portal</span>
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyLink(client.id)}>
                                {copiedClientId === client.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                <span className="sr-only">Copiar link</span>
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="py-1 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                                    <Link href={`/dashboard/clientes/${client.id}`}>
                                        <FilePen className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                    </Link>
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setClientToDelete(client)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Excluir</span>
                                </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
            {totalPages > 1 && (
              <CardFooter className="border-t pt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} 
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                         href="#"
                         onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} 
                         aria-disabled={currentPage === totalPages}
                         className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardFooter>
            )}
          </Card>
        )}
      </div>

      <AddClientSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSuccess={handleClientAdded}
      />
      
      <CreateContractModal
          isOpen={isContractModalOpen}
          onClose={() => {
              setIsContractModalOpen(false);
              setNewlyCreatedClient(null);
              setClientForContract(null);
          }}
          clients={clients}
          proposals={proposals}
          profile={profile}
          onClientListChange={setClients}
          selectedClientId={clientForContract?.id || newlyCreatedClient?.id}
          onContractAdded={() => fetchInitialData()} 
      />

       <ConfigureBillingModal
        isOpen={isBillingModalOpen}
        onClose={() => {
          setIsBillingModalOpen(false);
          setNewlyCreatedClient(null);
          setClientForBilling(null);
        }}
        clientId={clientForBilling?.id || newlyCreatedClient?.id}
        proposals={proposals}
        onBillingConfigured={() => fetchInitialData()}
      />
      
      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente e todos os seus dados associados, como contratos e cobranças.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteClient}
                className={cn(buttonVariants({ variant: "destructive" }))}
            >
                Sim, excluir cliente
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente os <strong>{selectedClients.length} clientes selecionados</strong> e todos os seus dados associados.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleBulkDelete}
                className={cn(buttonVariants({ variant: "destructive" }))}
            >
                Sim, excluir clientes
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <Check className="h-6 w-6 text-green-500 bg-green-100 rounded-full p-1" />
                Cliente criado com sucesso!
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4">
              O que você gostaria de fazer agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 mt-2">
             <CardAction
                icon={FileText}
                title="Criar Contrato"
                description="Elabore um contrato de prestação de serviços para formalizar a parceria com este cliente."
                onClick={() => handleSuccessAction('contract')}
             />
             <CardAction
                 icon={CreditCard}
                 title="Configurar Cobrança"
                 description="Defina uma cobrança recorrente para este cliente, com ou sem contrato."
                 onClick={() => handleSuccessAction('billing')}
            />
          </div>
        </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
