
'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import {
  Home,
  Users,
  FileSignature,
  DollarSign,
  ClipboardList,
  Inbox,
  LogOut,
  Settings,
  CreditCard,
  User,
  PanelLeft,
  Briefcase,
  AreaChart,
  Users2,
  BarChart3,
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
import { useRouter, usePathname } from 'next/navigation'
import { ChatModal } from '@/components/chat-modal'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BreadcrumbNav } from './_components/breadcrumb-nav'
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

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
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
            <BreadcrumbNav />
            <div className="flex items-center gap-4">
                 {userProfile && (
                    <Button asChild variant="outline" size="sm" className="hidden sm:flex items-center gap-2 border-green-500 bg-green-500/10 text-green-700 hover:bg-green-500/20 hover:text-green-800">
                      <Link href="/dashboard/settings/buy-credits">
                        <CreditCard className="h-4 w-4"/>
                        <span>Você tem {userProfile.credits ?? 0} créditos</span>
                      </Link>
                    </Button>
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

const NavItem = ({ href, icon: Icon, label }: { href: string, icon: React.ElementType, label: string }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href}>
            <Button
              variant={isActive ? 'secondary' : 'ghost'}
              size="icon"
              className={cn("rounded-lg", isActive && "bg-muted text-primary")}
              aria-label={label}
            >
              <Icon className="size-5" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={5}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const navItemsGeral = [
    { href: '/dashboard', icon: AreaChart, label: 'Dashboard' },
    { href: '/dashboard/clientes', icon: Users, label: 'Clientes' },
    { href: '/dashboard/propostas', icon: ClipboardList, label: 'Propostas' },
    { href: '/dashboard/contratos', icon: FileSignature, label: 'Contratos' },
    { href: '/dashboard/cobrancas', icon: DollarSign, label: 'Cobranças' },
];

const navItemsAgencia = [
    { href: '/dashboard/squads', icon: Users2, label: 'Squads' },
    { href: '/dashboard/equipe', icon: Briefcase, label: 'Equipe' },
    { href: '/dashboard/relatorios', icon: BarChart3, label: 'Relatórios' },
];

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
  
  const isSquadsSection = pathname.startsWith('/dashboard/squads');
  const baseNavItems = userProfile?.is_agency ? [...navItemsGeral, { href: '/dashboard/squads', icon: Users2, label: 'Squads' }] : navItemsGeral;
  const navItems = isSquadsSection ? navItemsAgencia : baseNavItems;


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <DashboardHeader 
            userProfile={userProfile} 
            onOpenChat={(client) => setSelectedChatClient(client)} 
        />
        <div className="flex flex-1">
             <aside className="fixed top-14 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex h-[calc(100vh-3.5rem)]">
                <nav className="flex flex-col items-center gap-4 px-2 py-4">
                    {navItems.map(item => <NavItem key={item.href} {...item} />)}
                </nav>
                <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
                    <Separator />
                    <NavItem href="/dashboard/settings/buy-credits" icon={CreditCard} label="Comprar Créditos" />
                    <NavItem href="/dashboard/settings/profile" icon={Settings} label="Configurações" />
                </nav>
            </aside>
            <main className="flex flex-1 flex-col sm:ml-14">
                <div className="flex-1 p-4 sm:p-6">
                    <Suspense fallback={<div className="flex-1 p-10"><Skeleton className="w-full h-full" /></div>}>
                        {children}
                    </Suspense>
                </div>
            </main>
        </div>
        {selectedChatClient && (
            <ChatModal 
                client={selectedChatClient} 
                onClose={() => setSelectedChatClient(null)} 
            />
        )}
    </div>
  )
}
