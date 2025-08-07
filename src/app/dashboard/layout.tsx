import Link from 'next/link'
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
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
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
    { href: '/dashboard/propostas', label: 'Propostas', icon: FileText },
    { href: '/dashboard/contratos', label: 'Contratos', icon: FileSignature },
]

const settingsItem = { href: '/dashboard/settings/profile', label: 'Configurações', icon: Settings }

function MainNav() {
    return (
        <SidebarMenu>
            {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                    <SidebarMenuButton tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            ))}
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
        <Sidebar side="left" variant="sidebar" collapsible="icon">
             <SidebarHeader className="h-14 items-center gap-2 border-b px-4 lg:h-[60px]">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Package2 className="h-6 w-6" />
                    <span className="">Acme Inc</span>
                </Link>
                <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </SidebarHeader>
             <SidebarContent>
                <MainNav />
            </SidebarContent>
            <SidebarFooter>
                 <SidebarMenu>
                     <SidebarMenuItem>
                         <Link href={settingsItem.href}>
                            <SidebarMenuButton tooltip={settingsItem.label}>
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
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
             <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1 text-lg font-semibold md:text-2xl">
                    {/* Aqui você pode adicionar o título da página dinamicamente se desejar */}
                </div>
            </header>
            <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  )
}
