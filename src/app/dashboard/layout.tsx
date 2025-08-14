
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Bell,
  Inbox,
  LogOut,
  Settings,
  MessageSquare
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
import { cn } from '@/lib/utils'
import { ChatModal } from '@/components/chat-modal'


function UserNav({ user }: { user: (Profile & { email: string })}) {
    const displayName = user.full_name || user.company_name || 'Usuário';
    const fallback = displayName.charAt(0).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative size-10 rounded-full p-0"
                >
                    <div className="rounded-full border-2 border-primary p-0.5">
                        <Avatar className="size-8">
                           <AvatarImage src={user.avatar_url || ''} alt="Avatar" />
                           <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                     <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
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
    )
}

function DashboardHeader({ 
    userProfile, 
    clients,
    onClientSelect
} : { 
    userProfile: (Profile & { email: string }) | null,
    clients: Cliente[],
    onClientSelect: (client: Cliente) => void;
}) {
     return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-10">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center">
                        <Image 
                            src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/Crivo.png" 
                            alt="Crivo Logo"
                            width={80}
                            height={30}
                        />
                    </Link>
                    <MainNav />
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notificações</span>
                    </Button>
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
                                        <DropdownMenuItem key={client.id} onSelect={() => onClientSelect(client)}>
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
                    {userProfile ? <UserNav user={userProfile} /> : <div className="size-10 rounded-full bg-muted animate-pulse" />}
                </div>
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

  return (
    <>
        <div className="flex min-h-screen flex-col">
            <DashboardHeader 
                userProfile={userProfile} 
                clients={clients}
                onClientSelect={(client) => setSelectedChatClient(client)}
            />
            <main className="flex-1 p-4 sm:p-10">{children}</main>
        </div>
        
        {selectedChatClient && (
            <ChatModal 
                client={selectedChatClient} 
                onClose={() => setSelectedChatClient(null)} 
            />
        )}
    </>
  )
}
