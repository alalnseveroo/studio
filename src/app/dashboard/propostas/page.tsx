
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { PlusCircle, FileText, CheckCircle, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { getProposals, deleteProposal } from '@/lib/actions/propostas'
import type { Proposta } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

function ProposalsGridSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-9 w-full" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

export default function PropostasPage() {
  const [proposals, setProposals] = useState<Proposta[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [proposalToDelete, setProposalToDelete] = useState<Proposta | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchProposals = async () => {
      setIsLoading(true);
      const { data } = await getProposals()
      setProposals(data || [])
      setIsLoading(false);
  }

  useEffect(() => {
    fetchProposals()
  }, [])
  
  const handleDeleteProposal = async () => {
    if (!proposalToDelete) return;
    const { error } = await deleteProposal(proposalToDelete.id);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Excluir',
        description: error.message,
      });
    } else {
      toast({
        title: 'Proposta Excluída!',
        description: 'A proposta foi removida com sucesso.',
      });
      fetchProposals();
    }
    setProposalToDelete(null);
  }


  return (
    <>
    <div className="flex flex-1 flex-col">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Minhas Propostas</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" className="h-9 gap-1">
            <Link href="/dashboard/propostas/nova">
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Criar Nova Proposta
                </span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? <ProposalsGridSkeleton /> : proposals.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
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
              <Card key={proposal.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="truncate pr-2">{proposal.name}</CardTitle>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/propostas/${proposal.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Ver / Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setProposalToDelete(proposal)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="text-xs">
                    {proposal.services.length} serviço(s) incluído(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2">
                    {proposal.services.slice(0, 3).map((service, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm truncate">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{service}</span>
                      </div>
                    ))}
                    {proposal.services.length > 3 && (
                      <p className="text-xs text-muted-foreground">e mais {proposal.services.length - 3}...</p>
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
    </div>
    
      <AlertDialog open={!!proposalToDelete} onOpenChange={() => setProposalToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a proposta "<strong>{proposalToDelete?.name}</strong>". Ela não poderá ser usada para gerar novos contratos.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteProposal}
                className={cn(buttonVariants({ variant: "destructive" }))}
            >
                Sim, excluir proposta
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
