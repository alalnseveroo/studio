
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
} from 'lucide-react'

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


const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, exact: true },
    { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
    { href: '/dashboard/propostas', label: 'Propostas', icon: FileText },
    { href: '/dashboard/contratos', label: 'Contratos', icon: FileSignature },
]

const settingsItem = { href: '/dashboard/settings', label: 'Configurações', icon: Settings }

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

function SettingsNav() {
     const pathname = usePathname()
     const isActive = (href: string) => pathname.startsWith(href)

     return (
        <SidebarMenu>
            <SidebarMenuItem>
                    <Link href={settingsItem.href}>
                    <SidebarMenuButton tooltip={settingsItem.label} isActive={isActive(settingsItem.href)}>
                        <settingsItem.icon />
                        <span>{settingsItem.label}</span>
                    </SidebarMenuButton>
                    </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton tooltip="Minha Conta">
                            <CircleUser />
                            <span>Minha Conta</span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Suporte</DropdownMenuItem>
                        <DropdownMenuSeparator />
                            <form action={signOut}>
                            <button type="submit" className="w-full">
                                <DropdownMenuItem>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sair</span>
                                </DropdownMenuItem>
                            </button>
                        </form>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
     )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="bg-card">
             <SidebarContent className="p-4">
                <MainNav />
            </SidebarContent>
            <SidebarFooter className="p-4">
                 <SettingsNav />
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
             <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1 text-lg font-semibold md:text-2xl" />
            </header>
            <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  )
}
