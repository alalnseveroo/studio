
'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronsUpDown,
  Check,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { getSquads } from '@/lib/actions/squads'
import type { Squad } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { getProfile } from '@/lib/actions/profile'
import type { Profile } from '@/lib/types'

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface SquadSwitcherProps extends PopoverTriggerProps {}

export function BreadcrumbNav() {
  const [open, setOpen] = React.useState(false)
  const [squads, setSquads] = React.useState<Squad[]>([])
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const pathname = usePathname()
  const router = useRouter()

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const [{ data: profileData }, { data: squadsData }] = await Promise.all([
        getProfile(),
        getSquads(),
      ])
      setProfile(profileData)
      setSquads(squadsData || [])
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const isSquadsSection = pathname.startsWith('/dashboard/squads');
  
  const handleSquadSelect = (squadId: string) => {
    setOpen(false)
    router.push(`/dashboard/squads/${squadId}`)
  }
  
  const selectedSquad = squads.find(s => pathname.includes(s.id));
  const breadcrumbSquadText = selectedSquad?.name || 'Visão Geral dos Squads';

  if (isLoading) {
    return <Skeleton className="h-6 w-48" />;
  }

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
        Gerenciamento Global
      </Link>
      
      {isSquadsSection && (
          <>
            <span className="text-muted-foreground">/</span>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-expanded={open}
                  className="p-1 h-auto text-sm hover:bg-muted"
                >
                  {breadcrumbSquadText}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                  <div className="p-2">
                     <Link href="/dashboard/squads" onClick={() => setOpen(false)} className={cn("flex w-full items-center rounded-md p-2 text-sm hover:bg-accent", !selectedSquad && "bg-accent")}>
                        <Users className="mr-2 h-4 w-4" /> Visão Geral dos Squads
                     </Link>
                  </div>
                  <div className="p-2 border-t">
                     <p className="px-2 text-xs text-muted-foreground mb-1">SELECIONE UM SQUAD</p>
                      {squads.map((squad) => (
                        <Button 
                            key={squad.id}
                            variant="ghost"
                            className={cn("w-full justify-start font-normal", selectedSquad?.id === squad.id && "font-semibold bg-accent")}
                            onClick={() => handleSquadSelect(squad.id)}
                        >
                            <Check className={cn("mr-2 h-4 w-4", selectedSquad?.id === squad.id ? "opacity-100" : "opacity-0")} />
                            {squad.name}
                        </Button>
                      ))}
                  </div>
              </PopoverContent>
            </Popover>
          </>
      )}
    </div>
  )
}
