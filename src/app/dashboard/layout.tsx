

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
import { useRouter } from 'next/navigation'
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
    onNavAttempt, 
    isProfileComplete 
} : { 
    userProfile: (Profile & { email: string }) | null,
    onNavAttempt: () => void,
    isProfileComplete: boolean,
}) {
     return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-10">
                <div className={cn("flex items-center gap-6", !isProfileComplete && "relative")}>
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <Package2 className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">Assistei</span>
                    </Link>
                    <div className={cn(!isProfileComplete && "pointer-events-none opacity-50")}>
                        <MainNav />
                    </div>
                    {!isProfileComplete && (
                        <div 
                            className="absolute inset-0 z-10"
                            onClick={onNavAttempt}
                            title="Complete seu perfil para navegar"
                        />
                    )}
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
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isProfileNeededDialogOpen, setIsProfileNeededDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchAndSetProfile() {
      const { data } = await getProfile();
      if (data) {
        setUserProfile(data as Profile & { email: string });
        setIsProfileComplete(!!data.is_completed);
      }
    }
    fetchAndSetProfile();
  }, []);

  const handleNavigationAttempt = () => {
    if (!isProfileComplete) {
      setIsProfileNeededDialogOpen(true);
    }
  };
  
  const goToProfile = () => {
      router.push('/dashboard/settings/profile');
  };

  return (
    <>
        <div className="flex min-h-screen flex-col">
            <DashboardHeader 
                userProfile={userProfile} 
                onNavAttempt={handleNavigationAttempt}
                isProfileComplete={isProfileComplete}
            />
            <main className="flex-1 sm:p-10">{children}</main>
        </div>
        
        <AlertDialog open={isProfileNeededDialogOpen} onOpenChange={setIsProfileNeededDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Perfil Incompleto</AlertDialogTitle>
                    <AlertDialogDescription>
                        Para começar a usar o sistema e aproveitar todos os recursos, primeiro você precisa completar o seu perfil.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={goToProfile}>
                        Configurar Perfil
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}
