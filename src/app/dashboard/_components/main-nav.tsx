
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
