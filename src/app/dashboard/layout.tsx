
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

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
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
        <SidebarMenu>
            {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                    <SidebarMenuButton tooltip={item.label} isActive={isActive(item.href, item.exact)}>
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            ))}
        </SidebarMenu>
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <div className="ml-auto flex items-center gap-2">
                {userProfile ? <UserNav user={userProfile} /> : <div className="size-10 rounded-full bg-muted animate-pulse" />}
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
    <SidebarProvider>
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="bg-sidebar">
             <SidebarContent className="p-4">
                <MainNav />
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <DashboardHeader />
            <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  )
}
