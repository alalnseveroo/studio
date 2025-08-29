
'use client'

import { BarChart3 } from "lucide-react"

export default function RelatoriosPage() {
    return (
        <div className="flex flex-1 flex-col">
            <div className="flex items-center">
                <h1 className="text-2xl font-normal">Relatórios</h1>
            </div>
             <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4">
                <div className="flex flex-col items-center gap-1 text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                    Página em Construção
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    Em breve, você poderá gerar relatórios de atividade e financeiros para seus squads e equipe.
                </p>
                </div>
            </div>
        </div>
    )
}
