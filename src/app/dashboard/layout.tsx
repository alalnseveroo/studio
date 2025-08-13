

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  Inbox,
  Package2,
  LogOut,
  Settings
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/actions/auth'
import { getProfile } from '@/lib/actions/profile'
import type { Profile } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MainNav } from './_components/main-nav'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'


function UserNav({ user }: { user: (Profile & { email: string })}) {
    const displayName = user.full_name || user.company_name || 'Usuário';
    const fallback = displayName.charAt(0).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative size-10 rounded-full p-0"
                >
                    <div className="rounded-full border-2 border-primary p-0.5">
                        <Avatar className="size-8">
                           <AvatarImage src={user.avatar_url || ''} alt="Avatar" />
                           <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                     <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                     <Link href="/dashboard/settings/profile">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOut} className="w-full">
                    <button type="submit" className="w-full">
                        <DropdownMenuItem>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </button>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function DashboardHeader({ 
    userProfile, 
} : { 
    userProfile: (Profile & { email: string }) | null,
}) {
     return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-10">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <Package2 className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">Assistei</span>
                    </Link>
                    <MainNav />
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notificações</span>
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Inbox className="h-5 w-5" />
                        <span className="sr-only">Caixa de Entrada</span>
                    </Button>
                    {userProfile ? <UserNav user={userProfile} /> : <div className="size-10 rounded-full bg-muted animate-pulse" />}
                </div>
            </div>
        </header>
     )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userProfile, setUserProfile] = useState<(Profile & { email: string }) | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchAndSetProfile() {
      const { data } = await getProfile();
      setUserProfile(data as Profile & { email: string } | null);
      setIsLoadingProfile(false);
    }
    fetchAndSetProfile();
  }, []);

  useEffect(() => {
    if (!isLoadingProfile && userProfile && !userProfile.is_completed) {
        if (pathname !== '/dashboard/settings/profile') {
            router.push('/dashboard/settings/profile');
        }
    } else if (!isLoadingProfile && !userProfile) {
        // Trata o caso do usuário recém-registrado sem perfil
        if (pathname !== '/dashboard/settings/profile') {
            router.push('/dashboard/settings/profile');
        }
    }
  }, [userProfile, isLoadingProfile, pathname, router]);

  return (
    <>
        <div className="flex min-h-screen flex-col">
            <DashboardHeader 
                userProfile={userProfile} 
            />
            <main className="flex-1 p-4 sm:p-10">{children}</main>
        </div>
    </>
  )
}
