
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AreaChart, Briefcase, Users, BarChart3 } from 'lucide-react'
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'


const navItemsAgencia = [
    { href: '/dashboard/squads', icon: AreaChart, label: 'Visão Geral' },
    { href: '/dashboard/equipe', icon: Briefcase, label: 'Equipe' },
    { href: '/dashboard/relatorios', icon: BarChart3, label: 'Relatórios' },
];


export function AgencyNav() {
    const pathname = usePathname();
    
    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
             <nav className="flex flex-col items-center gap-4 px-2 py-4">
                {navItemsAgencia.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <TooltipProvider key={item.href}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Link href={item.href}>
                                <Button
                                variant={isActive ? 'secondary' : 'ghost'}
                                size="icon"
                                className={cn("rounded-lg", isActive && "bg-muted text-primary")}
                                aria-label={item.label}
                                >
                                <item.icon className="size-5" />
                                </Button>
                            </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={5}>
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                        </TooltipProvider>
                    )
                })}
            </nav>
        </aside>
    )
}
