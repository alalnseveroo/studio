import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

export default function ContratosLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-10">
      <div className="flex items-center">
        <Skeleton className="h-9 w-32" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"><Skeleton className="h-4 w-4" /></TableHead>
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
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-28" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
