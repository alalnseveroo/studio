
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/clientes', label: 'Clientes' },
    { href: '/dashboard/propostas', label: 'Propostas' },
    { href: '/dashboard/contratos', label: 'Contratos' },
    { href: '/dashboard/cobrancas', label: 'Cobranças' },
]

export function MainNav() {
    const pathname = usePathname()
    
    return (
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
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
