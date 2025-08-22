
'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Bell,
  Inbox,
  LogOut,
  Settings,
  MessageSquare,
  User,
  CreditCard,
  PanelLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/actions/auth'
import { getProfile } from '@/lib/actions/profile'
import { getClients } from '@/lib/actions/clients'
import type { Profile, Cliente } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MainNav } from './_components/main-nav'
import { useRouter, usePathname } from 'next/navigation'
import { ChatModal } from '@/components/chat-modal'
import { Badge } from '@/components/ui/badge'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import MultiStepLoaderDemo from '@/components/multi-step-loader-demo'

function DashboardHeader({ 
    userProfile, 
} : { 
    userProfile: (Profile & { email: string }) | null,
}) {
     return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
            <div className="flex items-center gap-2">
                 <SidebarTrigger className="md:hidden" />
                 <Image 
                    src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/Crivo.png" 
                    alt="Crivo Logo"
                    width={80}
                    height={30}
                />
            </div>

            <div className="flex items-center gap-4">
                 {userProfile && (
                    <Badge variant="outline" className="hidden sm:flex items-center gap-2 border-green-500 bg-green-500/10 text-green-700">
                        <CreditCard className="h-4 w-4"/>
                        <span>Você tem {userProfile.credits ?? 0} créditos</span>
                    </Badge>
                 )}
            </div>
        </header>
     )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userProfile, setUserProfile] = useState<(Profile & { email: string }) | null>(null)
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [selectedChatClient, setSelectedChatClient] = useState<Cliente | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchInitialData() {
      setIsLoadingProfile(true);
      const [{ data: profileData }, { data: clientData }] = await Promise.all([
        getProfile(),
        getClients()
      ]);

      const profile = profileData as Profile & { email: string } | null;
      setUserProfile(profile);
      setClients(clientData || []);
      setIsLoadingProfile(false);

      if (profile && !profile.is_completed) {
        if (pathname !== '/dashboard/settings/profile') {
          router.push('/dashboard/settings/profile');
        }
      } else if (!profile) {
        if (pathname !== '/dashboard/settings/profile') {
          router.push('/dashboard/settings/profile');
        }
      }
    }
    fetchInitialData();
  }, [pathname, router]);

  const displayName = userProfile?.full_name || userProfile?.company_name || 'Usuário';
  const fallback = displayName.charAt(0).toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar>
            <SidebarHeader>
                 <Image 
                    src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/Crivo.png" 
                    alt="Crivo Logo"
                    width={80}
                    height={30}
                />
            </SidebarHeader>
            <SidebarContent>
                 <MainNav />
            </SidebarContent>
            <SidebarFooter className="p-4 space-y-4">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-full justify-start gap-2">
                             <Bell className="h-5 w-5" />
                             <span className="group-data-[collapsible=icon]:hidden">Notificações</span>
                        </Button>
                    </DropdownMenuTrigger>
                 </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-full justify-start gap-2">
                            <Inbox className="h-5 w-5" />
                            <span className="group-data-[collapsible=icon]:hidden">Caixa de Entrada</span>
                        </Button>
                    </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Conversas</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         <DropdownMenuGroup>
                            {clients.length > 0 ? (
                                clients.map(client => (
                                    <DropdownMenuItem key={client.id} onSelect={() => setSelectedChatClient(client)}>
                                        <Avatar className="h-6 w-6 mr-2">
                                            <AvatarImage src={client.avatar_url || ''} />
                                            <AvatarFallback>{(client.full_name || client.company_name || 'C').charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>{client.full_name || client.company_name}</span>
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <DropdownMenuItem disabled>
                                    Nenhum cliente encontrado.
                                </DropdownMenuItem>
                            )}
                         </DropdownMenuGroup>
                     </DropdownMenuContent>
                </DropdownMenu>

                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" className="w-full justify-start gap-2 p-2">
                            <Avatar className="size-8">
                               <AvatarImage src={userProfile?.avatar_url || ''} alt="Avatar" />
                               <AvatarFallback>{fallback}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                                <span className="text-sm font-medium">{displayName}</span>
                                <span className="text-xs text-muted-foreground">{userProfile?.email}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                             <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{displayName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                {userProfile?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem asChild>
                             <Link href="/dashboard/settings/profile">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Configurações</span>
                            </Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem asChild>
                             <Link href="/dashboard/settings/public-profile">
                                <User className="mr-2 h-4 w-4" />
                                <span>Perfil Público</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <form action={signOut} className="w-full">
                            <button type="submit" className="w-full">
                                <DropdownMenuItem>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sair</span>
                                </DropdownMenuItem>
                            </button>
                        </form>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col flex-1 overflow-hidden">
          <DashboardHeader userProfile={userProfile} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
             <Suspense fallback={<MultiStepLoaderDemo />}>
                {children}
             </Suspense>
          </main>
        </div>
      </div>
        
      {selectedChatClient && (
          <ChatModal 
              client={selectedChatClient} 
              onClose={() => setSelectedChatClient(null)} 
          />
      )}
    </SidebarProvider>
  )
}
