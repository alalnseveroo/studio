
'use client'

import { Button } from "@/components/ui/button"
import { Users2, PlusCircle } from "lucide-react"

export default function SquadsPage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-10">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Squads</h1>
                 <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" className="h-8 gap-1" disabled>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Criar Squad
                        </span>
                    </Button>
                </div>
            </div>
             <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                <div className="flex flex-col items-center gap-1 text-center">
                <Users2 className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                    Nenhum squad criado
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    Crie squads para organizar seus clientes e atribuir secretárias para gerenciá-los.
                </p>
                </div>
            </div>
        </div>
    )
}
