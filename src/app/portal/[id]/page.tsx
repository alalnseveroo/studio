import { getClientById } from '@/lib/actions/clients'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { AlertCircle, User } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface PortalPageProps {
  params: {
    id: string
  }
}

export default async function ClientPortalPage({ params }: PortalPageProps) {
  const { data: client, error } = await getClientById(params.id)

  if (error || !client) {
    notFound()
  }

  const displayName = client.full_name || client.company_name || 'Cliente'
  const fallbackLetter = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4">
      <main className="w-full max-w-md">
        <Card className="animate-in fade-in-50 duration-500">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={client.avatar_url || undefined} alt={`Avatar de ${displayName}`} />
              <AvatarFallback className="text-4xl">
                {fallbackLetter}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="pt-4 text-2xl font-bold">
              {displayName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Portal do Cliente</AlertTitle>
                <AlertDescription>
                    Este é um espaço seguro para visualizar o andamento e assinar seus contratos.
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
