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
import { AddClientModal } from '@/components/add-client-modal'
import { getClients } from '@/lib/actions/clients'
import type { Cliente } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

export default function ClientesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clients, setClients] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchClients() {
      setIsLoading(true)
      const { data } = await getClients()
      setClients(data || [])
      setIsLoading(false)
    }
    fetchClients()
  }, [])

  const handleClientAdded = (newClient: Cliente) => {
    setClients((prevClients) => [newClient, ...prevClients])
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Clientes</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Adicionar Cliente
              </span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <p>Carregando clientes...</p>
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
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">
                      <span className="sr-only">Avatar</span>
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>ID Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="hidden sm:table-cell">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={client.avatar_url || ''} alt="Avatar do Cliente" />
                            <AvatarFallback>{client.full_name ? client.full_name.charAt(0) : 'C'}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{client.full_name || client.company_name}</TableCell>
                       <TableCell>
                        <Badge variant="outline">{client.client_id}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                         <Badge variant="secondary">Ativo</Badge>
                      </TableCell>
                      <TableCell>
                         <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/clientes/${client.id}`}>
                                Editar
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

      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </>
  )
}
