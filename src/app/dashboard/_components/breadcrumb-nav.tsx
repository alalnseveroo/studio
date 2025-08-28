
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

  const currentPath = pathname.split('/dashboard/')[1] || ''
  const isSquadsSection = currentPath.startsWith('squads');
  
  const formattedSquads = squads.map((squad) => ({
    label: squad.name,
    value: squad.id,
    href: `/dashboard/squads/${squad.id}`,
  }))

  const globalOption = {
    label: 'Gerenciamento Global',
    value: 'global',
    href: '/dashboard',
  }
  
  const squadOption = {
      label: 'Squad Geral',
      value: 'squads',
      href: '/dashboard/squads'
  }

  const allOptions = [globalOption, squadOption];

  const selectedOption = isSquadsSection ? squadOption : globalOption;

  const handleSelect = (option: { value: string, href: string }) => {
    setOpen(false)
    if (option.value === 'create') {
        router.push('/dashboard/squads') // Futuramente, abre o modal
    } else {
        router.push(option.href)
    }
  }
  
  const displayName = profile?.full_name || profile?.company_name || 'Agência'
  const fallback = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-2">
       <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Selecionar contexto"
            className="w-[220px] justify-between"
          >
            {isLoading ? <Skeleton className="h-5 w-3/4" /> : selectedOption?.label}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Procurar contexto..." />
              <CommandEmpty>Nenhum contexto encontrado.</CommandEmpty>
              <CommandGroup>
                {allOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option)}
                    className="text-sm"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {option.label}
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedOption?.value === option.value
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isSquadsSection && (
          <>
            <span className="text-muted-foreground">/</span>
             <Link href="/dashboard/squads">
                <Button variant="ghost" className="p-2 h-auto text-sm">
                    {squads.find(s => pathname.includes(s.id))?.name || 'Visão Geral'}
                </Button>
            </Link>
          </>
      )}
    </div>
  )
}
