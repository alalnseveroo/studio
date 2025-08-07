import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b p-4 sm:p-6">
        <div className="flex items-center gap-2">
           <SidebarTrigger />
           <h1 className="text-2xl font-bold text-primary font-headline">
            DASH
          </h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
        <div className="text-center animate-in fade-in-50 duration-1000">
          <h2 className="text-4xl font-bold tracking-tighter text-primary font-headline md:text-6xl">
            Bem-vindo!
          </h2>
          <p className="text-muted-foreground mt-2">
            Você está logado como {user.email}
          </p>
        </div>
      </main>
    </div>
  )
}