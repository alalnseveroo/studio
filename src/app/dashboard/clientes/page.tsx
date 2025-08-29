
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
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
import { Input } from '@/components/ui/input'
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddClientSheet } from '@/components/add-client-sheet'
import { getClients, deleteClient, deleteMultipleClients } from '@/lib/actions/clients'
import type { Cliente, Contrato, Profile } from '@/lib/types'
import { getContracts } from '@/lib/actions/contratos'
import { getProfile } from '@/lib/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowUpDown, ChevronDown, Copy, PlusCircle, Trash2, MoreHorizontal, Check, Link2, FilePen, FileWarning } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { CreateContractModal } from '@/components/create-contract-modal'
import { getProposals } from '@/lib/actions/propostas'
import { Skeleton } from '@/components/ui/skeleton'


function ClientsTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-64" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-32" />
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[48px]"><Skeleton className="h-5 w-5" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                            <TableHead className="text-center"><Skeleton className="h-5 w-20" /></TableHead>
                            <TableHead className="w-[80px] text-right"><Skeleton className="h-5 w-16" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                             <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <div className="flex items-center justify-end space-x-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
            </div>
        </div>
    )
}

function ClientsDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  
  const [clients, setClients] = React.useState<Cliente[]>([])
  const [contracts, setContracts] = React.useState<Contrato[]>([])
  const [profile, setProfile] = React.useState<Profile | null>(null)
  
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false)
  const [isContractModalOpen, setIsContractModalOpen] = React.useState(false)
  
  const [clientToDelete, setClientToDelete] = React.useState<Cliente | null>(null)
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false)
  const [clientForContract, setClientForContract] = React.useState<Cliente | null>(null)
  const [copiedClientId, setCopiedClientId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const router = useRouter()
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    const [{ data: clientData }, { data: profileData }, { data: contractsData }] = await Promise.all([
      getClients(),
      getProfile(),
      getContracts()
    ]);
    setClients(clientData || [])
    setContracts(contractsData || []);
    setProfile(profileData as Profile | null);
    setIsLoading(false);
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])
  
  const openContractModalForClient = (client: Cliente) => {
    if (profile && profile.credits <= 0) {
        router.push('/dashboard/settings/buy-credits');
        return;
    }
    setClientForContract(client);
    setIsContractModalOpen(true);
  }
  
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
  
  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    const { error } = await deleteClient(clientToDelete.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: error.message });
    } else {
      toast({ title: 'Cliente Excluído!', description: 'O cliente foi removido com sucesso.' });
      fetchData();
      table.setRowSelection({});
    }
    setClientToDelete(null);
  }

  const handleBulkDelete = async (selectedRows: Cliente[]) => {
    if (selectedRows.length === 0) return;
    const { error } = await deleteMultipleClients(selectedRows.map(r => r.id));
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: error.message });
    } else {
      toast({ title: 'Clientes Excluídos!', description: `${selectedRows.length} clientes foram removidos com sucesso.` });
      fetchData();
      table.setRowSelection({});
    }
    setIsBulkDeleteConfirmOpen(false);
  }
  
  const handleClientAdded = () => {
      fetchData();
      setIsAddSheetOpen(false);
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


  const columns: ColumnDef<Cliente>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={ table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate") }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "full_name",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Cliente
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const client = row.original;
        const name = client.full_name || client.company_name;
        return (
            <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={client.avatar_url || ''} alt="Avatar do Cliente" />
                    <AvatarFallback>{(name || 'C').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{name}</span>
                    <span className="text-xs text-muted-foreground">{client.email}</span>
                </div>
            </div>
        )
      },
    },
    {
      id: "contrato",
      header: "Contrato",
      cell: ({ row }) => {
        const client = row.original;
        const clientContracts = contracts.filter(c => c.cliente_id === client.id);
        const status = getContractStatusInfo(clientContracts);
        return (
            <Badge variant="outline" className={cn("font-normal", status.className)}>{status.text}</Badge>
        )
      }
    },
    {
      accessorKey: "email",
      header: "E-mail"
    },
    {
      id: "portal",
      header: () => <div className="text-center">Portal</div>,
      cell: ({ row }) => {
          const client = row.original;
          return (
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
          )
      }
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const client = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/clientes/${client.id}`)}>
                <FilePen className="mr-2 h-4 w-4" /> Ver / Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openContractModalForClient(client)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Gerar Contrato
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setClientToDelete(client)}>
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  
  const table = useReactTable({
    data: clients,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  
  const selectedRowsForDeletion = table.getFilteredSelectedRowModel().rows.map(row => row.original);

  if (isLoading) {
      return <ClientsTableSkeleton />;
  }

  return (
    <>
    <div className="w-full">
       <div className="flex items-center py-4">
        <Input
          placeholder="Filtrar por e-mail..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm h-9"
        />
        <div className="ml-auto flex items-center gap-2">
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsBulkDeleteConfirmOpen(true)}
                >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Excluir ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
            )}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                Colunas <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                    return (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                        }
                    >
                        {column.id === 'full_name' ? 'Cliente' : column.id}
                    </DropdownMenuCheckboxItem>
                    )
                })}
            </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={() => setIsAddSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Cliente
            </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileWarning className="h-8 w-8 text-muted-foreground" />
                    <p className="font-medium text-base">Nenhum cliente encontrado.</p>
                    <p className="text-sm text-muted-foreground">Tente adicionar seu primeiro cliente para começar.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
    
      <AddClientSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSuccess={handleClientAdded}
      />
      
      {clientForContract && <CreateContractModal
          isOpen={isContractModalOpen}
          onClose={() => {
              setIsContractModalOpen(false);
              setClientForContract(null);
          }}
          clients={clients}
          proposals={[]}
          profile={profile}
          onClientListChange={setClients}
          selectedClientId={clientForContract?.id}
          onContractAdded={() => fetchData()} 
      />}
      
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
                Esta ação não pode ser desfeita. Isso excluirá permanentemente os <strong>{selectedRowsForDeletion.length} clientes selecionados</strong> e todos os seus dados associados.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                onClick={() => handleBulkDelete(selectedRowsForDeletion)}
                className={cn(buttonVariants({ variant: "destructive" }))}
            >
                Sim, excluir clientes
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


export default function ClientesPage() {
    return (
        <div className="flex flex-1 flex-col">
            <div className="flex items-center">
                <h1 className="text-2xl font-bold">Clientes</h1>
            </div>
            <ClientsDataTable />
        </div>
    )
}
