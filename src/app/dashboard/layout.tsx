
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"

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

function UserNav({ user, className }: { user: (Profile & { email: string }), className?: string }) {
    const [open, setOpen] = useState(false)
    
    const displayName = user.full_name || user.company_name || 'Usuário';
    const fallback = displayName.charAt(0).toUpperCase();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Selecionar um membro da equipe"
                    className={cn("w-full justify-start gap-2", className)}
                >
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={undefined} alt="Avatar" />
                        <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                        <span className="font-medium truncate">{displayName}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" side="right" align="start">
                <Command>
                    <CommandList>
                        <CommandGroup>
                             <Link href="/dashboard/settings/profile">
                                <CommandItem onSelect={() => setOpen(false)} className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configurações
                                </CommandItem>
                            </Link>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <form action={signOut} className="w-full">
                                <button type="submit" className="w-full">
                                    <CommandItem onSelect={() => setOpen(false)} className="cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sair
                                    </CommandItem>
                                </button>
                            </form>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}


function SettingsNav() {
     const [userProfile, setUserProfile] = useState<(Profile & { email: string }) | null>(null)
     const pathname = usePathname()
     
     useEffect(() => {
        async function loadProfile() {
            const { data } = await getProfile();
            if (data) {
                setUserProfile(data as Profile & { email: string });
            }
        }
        loadProfile();
     }, [])

     if (!userProfile) {
        return (
             <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
                 <div className="flex flex-col gap-1">
                    <div className="h-4 w-20 rounded-md bg-muted animate-pulse" />
                    <div className="h-3 w-28 rounded-md bg-muted animate-pulse" />
                </div>
            </div>
        )
     }

     return (
        <SidebarMenu>
             <SidebarMenuItem>
                <UserNav user={userProfile} />
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
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="bg-sidebar">
             <SidebarContent className="p-4">
                <MainNav />
            </SidebarContent>
            <SidebarFooter className="p-4">
                 <SettingsNav />
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  )
}
