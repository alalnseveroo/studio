import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'

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
      <header className="flex items-center justify-end p-4 sm:p-6">
        <form action={signOut}>
            <Button variant="outline">Sign Out</Button>
        </form>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <h1 className="text-7xl font-bold tracking-tighter text-primary font-headline animate-in fade-in zoom-in-50 duration-1000 md:text-9xl">
          DASH
        </h1>
      </main>
    </div>
  )
}
