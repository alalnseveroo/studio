import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Bem-vindo!</CardTitle>
        <CardDescription>Você está logado como {user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-full flex-col items-center justify-center gap-8">
            <div className="text-center animate-in fade-in-50 duration-1000">
            <h2 className="text-4xl font-bold tracking-tighter text-primary font-headline md:text-6xl">
                Bem-vindo!
            </h2>
            <p className="text-muted-foreground mt-2">
                Você está logado como {user.email}
            </p>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
