
'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronsUpDown,
  Check,
  PlusCircle,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { getSquads } from '@/lib/actions/squads'
import type { Squad } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

  const currentSquadId = pathname.split('/squads/')[1]?.split('/')[0] || 'geral'
  
  const formattedSquads = squads.map((squad) => ({
    label: squad.name,
    value: squad.id,
  }))

  const generalOption = {
    label: 'Visão Geral',
    value: 'geral',
  }

  const allOptions = [generalOption, ...formattedSquads]

  const selectedSquad = allOptions.find((squad) => squad.value === currentSquadId)

  const handleSquadSelect = (squadValue: string) => {
    setOpen(false)
    if (squadValue === 'geral') {
      router.push('/dashboard')
    } else if (squadValue === 'create') {
        // Futuramente, abrir o modal de criação de squad
        router.push('/dashboard/squads')
    } else {
      router.push(`/dashboard/squads/${squadValue}`)
    }
  }
  
  const displayName = profile?.full_name || profile?.company_name || 'Agência'
  const fallback = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarImage src={profile?.avatar_url || ''} alt="Avatar" />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <span className="font-semibold text-sm hidden md:block">{displayName}</span>
      </Link>
      <span className="text-muted-foreground">/</span>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Selecionar um squad"
            className="w-[200px] justify-between"
          >
            {isLoading ? <Skeleton className="h-5 w-3/4" /> : selectedSquad?.label}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Procurar squad..." />
              <CommandEmpty>Nenhum squad encontrado.</CommandEmpty>
              <CommandGroup>
                {allOptions.map((squad) => (
                  <CommandItem
                    key={squad.value}
                    onSelect={() => handleSquadSelect(squad.value)}
                    className="text-sm"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {squad.label}
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedSquad?.value === squad.value
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
                <CommandGroup>
                    <CommandItem onSelect={() => handleSquadSelect('create')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Squad
                    </CommandItem>
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
