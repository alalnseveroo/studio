
'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, PlusCircle, MoreVertical, Loader2 } from "lucide-react"
import { getTeamMembers } from "@/lib/actions/team"
import type { Profile } from '@/lib/types'
import { InviteMemberModal } from "@/components/invite-member-modal"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

type TeamMemberWithProfile = {
    id: string;
    role: string;
    profiles: Profile | null;
}

function TeamPageSkeleton() {
    return (
        <div className="rounded-md border mt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-md" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-md" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default function EquipePage() {
    const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();

    const fetchTeam = async () => {
        setIsLoading(true);
        const { data, error } = await getTeamMembers();
        if (error) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } else {
            setTeamMembers(data || []);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchTeam();
    }, []);

    const handleInviteSuccess = () => {
        setIsModalOpen(false);
        fetchTeam(); // Recarrega a lista de membros
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex items-center">
                <h1 className="text-2xl font-normal">Equipe</h1>
                 <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" className="h-9 gap-1" onClick={() => setIsModalOpen(true)}>
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Convidar Membro
                        </span>
                    </Button>
                </div>
            </div>
            
            {isLoading ? <TeamPageSkeleton /> : (
                 <div className="rounded-md border mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Membro</TableHead>
                                <TableHead>Função</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamMembers.length > 0 ? (
                                teamMembers.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.profiles?.avatar_url || undefined} alt={member.profiles?.full_name || 'Membro'} />
                                                    <AvatarFallback>{(member.profiles?.full_name || 'M').charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{member.profiles?.full_name || 'Nome não definido'}</span>
                                                    <span className="text-xs text-muted-foreground">{member.profiles?.email || 'E-mail não disponível'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">{member.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="default" className='bg-green-100 text-green-800'>
                                                Ativo
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="font-medium">Nenhum membro na equipe.</p>
                                        <p className="text-sm text-muted-foreground">Clique em "Convidar Membro" para começar.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
            <InviteMemberModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleInviteSuccess}
            />
        </div>
    )
}
