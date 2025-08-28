'use client'

import { Users } from "lucide-react"

export default function EquipePage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-10">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Equipe</h1>
            </div>
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                <div className="flex flex-col items-center gap-1 text-center">
                <Users className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                    Página em Construção
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    Aqui você poderá convidar e gerenciar as secretárias da sua agência.
                </p>
                </div>
            </div>
        </div>
    )
}
