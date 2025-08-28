'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/dashboard', label: 'Visão Geral' },
    { href: '/dashboard/equipe', label: 'Equipe' },
    { href: '/dashboard/squads', label: 'Squads' },
    { href: '/dashboard/relatorios', label: 'Relatórios' },
    { href: '/dashboard/clientes', label: 'Clientes' },
    { href: '/dashboard/propostas', label: 'Propostas' },
    { href: '/dashboard/contratos', label: 'Contratos' },
]

export function AgencyNav() {
    const pathname = usePathname()
    
    return (
        <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
            {navItems.map((item) => (
                <Link 
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "transition-colors hover:text-primary",
                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    )
}
