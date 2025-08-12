
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
import { getClients, deleteClient } from '@/lib/actions/clients'
import type { Cliente } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { PlusCircle, Loader2, FilePen, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const ITEMS_PER_PAGE = 10;

export default function ClientesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [clients, setClients] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null)
  const { toast } = useToast()

  const fetchClients = async () => {
    setIsLoading(true)
    const { data } = await getClients()
    setClients(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchClients()
  }, [])
  
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
      // Refetch clients after deletion
      await fetchClients()
    }
    setClientToDelete(null)
  }


  const handleClientAdded = (newClient: Cliente) => {
    setClients((prevClients) => [newClient, ...prevClients])
  }
  
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'border-green-500 bg-green-500/10 text-green-700'
      case 'Inativo':
        return 'border-red-500 bg-red-500/10 text-red-700'
      case 'Pendente':
        return 'border-orange-500 bg-orange-500/10 text-orange-700'
      default:
        return 'border-gray-500 bg-gray-500/10 text-gray-700'
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Clientes</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" onClick={() => setIsSheetOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Adicionar Cliente
              </span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : clients.length === 0 ? (
           <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                Você ainda não tem clientes
              </h3>
              <p className="text-sm text-muted-foreground">
                Comece a adicionar clientes para vê-los aqui.
              </p>
               <Button className="mt-4" onClick={() => setIsSheetOpen(true)}>Adicionar Cliente</Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Mobile View - Cards */}
              <div className="divide-y divide-border md:hidden">
                {paginatedClients.map((client) => (
                  <div key={client.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                       <Avatar className="h-10 w-10 border">
                          <AvatarImage src={client.avatar_url || ''} alt="Avatar do Cliente" />
                          <AvatarFallback>{(client.full_name || client.company_name || 'C').charAt(0)}</AvatarFallback>
                       </Avatar>
                       <div className="flex-1">
                          <p className="font-semibold text-sm truncate">{client.full_name || client.company_name}</p>
                          <p className="text-xs text-muted-foreground">{client.client_id}</p>
                       </div>
                       <div className="flex gap-2">
                        <Button asChild variant="outline" size="icon" className="h-8 w-8">
                            <Link href={`/dashboard/clientes/${client.id}`}>
                                <FilePen className="h-4 w-4" />
                                <span className="sr-only">Ver / Editar</span>
                            </Link>
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setClientToDelete(client)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </div>
                     <div className="text-xs space-y-1 text-muted-foreground">
                        <p><span className="font-medium text-foreground">E-mail:</span> {client.email || 'Não informado'}</p>
                        <p><span className="font-medium text-foreground">Profissão:</span> {client.profession || 'Não informado'}</p>
                        <div className="flex items-center gap-1.5"><span className="font-medium text-foreground">Status:</span> <Badge variant="outline" className={cn("font-normal text-xs px-1.5 py-0", getStatusClass('Ativo'))}>Ativo</Badge></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[60px] border-r">
                      <Checkbox
                        checked={selectedClients.length > 0 && selectedClients.length === paginatedClients.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead className="w-[120px] border-r">Código</TableHead>
                    <TableHead className="border-r">Cliente</TableHead>
                    <TableHead className="hidden xl:table-cell border-r">Profissão</TableHead>
                    <TableHead className="hidden lg:table-cell border-r">E-mail</TableHead>
                    <TableHead className="w-[100px] border-r">Status</TableHead>
                    <TableHead className="w-[120px] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow key={client.id} data-state={selectedClients.includes(client.id) ? 'selected' : ''} className="h-12">
                      <TableCell className="py-1 border-r">
                         <Checkbox
                          checked={selectedClients.includes(client.id)}
                          onCheckedChange={(checked) => handleSelectClient(client.id, !!checked)}
                          aria-label={`Selecionar cliente ${client.full_name}`}
                        />
                      </TableCell>
                      <TableCell className="py-1 border-r">{client.client_id}</TableCell>
                      <TableCell className="font-medium py-1 border-r">
                         <div className="flex items-center gap-3">
                           <Avatar className="h-6 w-6">
                              <AvatarImage src={client.avatar_url || ''} alt="Avatar do Cliente" />
                              <AvatarFallback>{(client.full_name || client.company_name || 'C').charAt(0)}</AvatarFallback>
                           </Avatar>
                           <span>{client.full_name || client.company_name}</span>
                         </div>
                      </TableCell>
                       <TableCell className="hidden xl:table-cell py-1 border-r">{client.profession || 'Não informado'}</TableCell>
                       <TableCell className="hidden lg:table-cell py-1 border-r">{client.email || 'Não informado'}</TableCell>
                      <TableCell className="py-1 border-r">
                         <Badge variant="outline" className={cn("font-normal", getStatusClass('Ativo'))}>Ativo</Badge>
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
                  ))}
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
    </>
  )
}

    