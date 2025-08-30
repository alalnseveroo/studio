
'use client'

import { Button } from "@/components/ui/button"
import { Users, PlusCircle } from "lucide-react"

export default function EquipePage() {
    return (
        <div className="flex flex-1 flex-col">
            <div className="flex items-center">
                <h1 className="text-2xl font-normal">Equipe</h1>
                 <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" className="h-9 gap-1" disabled>
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Convidar Membro
                        </span>
                    </Button>
                </div>
            </div>
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4">
                <div className="flex flex-col items-center gap-1 text-center">
                <Users className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                    Nenhum membro na equipe
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    Clique em "Convidar Membro" para adicionar secretárias à sua agência e começar a delegar tarefas.
                </p>
                </div>
            </div>
        </div>
    )
}
