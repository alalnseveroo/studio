
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  CircleUser,
  Home,
  Users,
  Settings,
  FileText,
  FileSignature,
  Package2,
  LogOut,
  ChevronsUpDown,
  DollarSign,
  Inbox,
} from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { signOut } from '@/lib/actions/auth'
import { getProfile } from '@/lib/actions/profile'
import type { Profile } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, exact: true },
    { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
    { href: '/dashboard/propostas', label: 'Propostas', icon: FileText },
    { href: '/dashboard/contratos', label: 'Contratos', icon: FileSignature },
    { href: '/dashboard/cobrancas', label: 'Cobranças', icon: DollarSign },
]

function MainNav() {
    const pathname = usePathname()
    
    const isActive = (href: string, exact: boolean = false) => {
        if (exact) {
            return pathname === href
        }
        return pathname.startsWith(href)
    }

    return (
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "transition-colors hover:text-primary",
                        isActive(item.href, item.exact) ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    )
}

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
                           <AvatarImage src={undefined} alt="Avatar" />
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

function DashboardHeader() {
    const [userProfile, setUserProfile] = useState<(Profile & { email: string }) | null>(null)
    useEffect(() => {
        async function loadProfile() {
            const { data } = await getProfile();
            if (data) {
                setUserProfile(data as Profile & { email: string });
            }
        }
        loadProfile();
     }, [])

     return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <Package2 className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">Virtei</span>
                    </Link>
                    <MainNav />
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notificações</span>
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Inbox className="h-5 w-5" />
                        <span className="sr-only">Caixa de Entrada</span>
                    </Button>
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
  return (
    <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 container py-6">{children}</main>
    </div>
  )
}
