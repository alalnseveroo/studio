'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  FileText,
  FileSignature,
  DollarSign,
} from 'lucide-react'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, exact: true },
    { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
    { href: '/dashboard/propostas', label: 'Propostas', icon: FileText },
    { href: '/dashboard/contratos', label: 'Contratos', icon: FileSignature },
    { href: '/dashboard/cobrancas', label: 'Cobranças', icon: DollarSign },
]

export function MainNav() {
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
                        <SidebarMenuButton isActive={isActive(item.href, item.exact)}>
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    )
}
