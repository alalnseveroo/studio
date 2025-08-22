
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
import { CrivoLoader } from '@/components/crivo-loader'

function DashboardHeader({ 
    userProfile, 
    onOpenChat 
} : { 
    userProfile: (Profile & { email: string }) | null,
    onOpenChat: (client: Cliente) => void 
}) {
  const [clients, setClients] = useState<Cliente[]>([]);

  useEffect(() => {
    async function fetchClients() {
      const { data } = await getClients();
      setClients(data || []);
    }
    fetchClients();
  }, []);

  const displayName = userProfile?.full_name || userProfile?.company_name || 'Usuário';
  const fallback = displayName.charAt(0).toUpperCase();

     return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
            <div className="flex items-center gap-4">
                 <Image 
                    src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/Crivo.png" 
                    alt="Crivo Logo"
                    width={80}
                    height={30}
                />
            </div>

            <div className="flex-1 flex justify-center">
                <MainNav />
            </div>

            <div className="flex items-center gap-4">
                 {userProfile && (
                    <Badge variant="outline" className="hidden sm:flex items-center gap-2 border-green-500 bg-green-500/10 text-green-700">
                        <CreditCard className="h-4 w-4"/>
                        <span>Você tem {userProfile.credits ?? 0} créditos</span>
                    </Badge>
                 )}
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Inbox className="h-5 w-5" />
                            <span className="sr-only">Caixa de Entrada</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Conversas</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {clients.length > 0 ? (
                                clients.map(client => (
                                    <DropdownMenuItem key={client.id} onSelect={() => onOpenChat(client)}>
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
                         <Button variant="ghost" size="icon" className="rounded-full">
                            <Avatar className="size-8">
                               <AvatarImage src={userProfile?.avatar_url || ''} alt="Avatar" />
                               <AvatarFallback>{fallback}</AvatarFallback>
                            </Avatar>
                            <span className="sr-only">Toggle user menu</span>
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
  const [selectedChatClient, setSelectedChatClient] = useState<Cliente | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchInitialData() {
      const { data: profileData } = await getProfile();
      const profile = profileData as Profile & { email: string } | null;
      setUserProfile(profile);

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

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader 
          userProfile={userProfile} 
          onOpenChat={(client) => setSelectedChatClient(client)} 
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
      {selectedChatClient && (
          <ChatModal 
              client={selectedChatClient} 
              onClose={() => setSelectedChatClient(null)} 
          />
      )}
    </div>
  )
}
