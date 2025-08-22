import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ClientesLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-10">
      <div className="flex items-center">
        <Skeleton className="h-9 w-32" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]"><Skeleton className="h-4 w-4" /></TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden lg:table-cell">E-mail</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Portal</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-64" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
