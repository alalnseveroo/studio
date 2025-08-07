import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Home, Settings, LogOut, PanelLeft } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/server'
import { Separator } from '@/components/ui/separator'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-2">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary font-headline px-2">
                    DASH
                </h1>
                <SidebarTrigger />
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                <Home />
                Início
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings />
                Configurações
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 flex flex-col gap-2">
          <Separator className="my-1" />
           <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/40x40.png" />
              <AvatarFallback>
                {user?.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {user?.email}
              </span>
              <span className="text-xs text-muted-foreground">
                Online
              </span>
            </div>
          </div>
          <form action={signOut} className="w-full">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LogOut />
              Sair
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
