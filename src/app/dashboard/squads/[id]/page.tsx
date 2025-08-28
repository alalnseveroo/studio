
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BarChart3, Users2 } from 'lucide-react'

export default function SquadDetailPage() {
    const params = useParams()
    const squadId = params.id as string

    // Aqui você buscaria os dados do squad usando o squadId
    // const [squad, setSquad] = useState(null)
    // const [isLoading, setIsLoading] = useState(true)

    // useEffect(() => {
    //     fetchDataForSquad(squadId)...
    // }, [squadId])

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Detalhes do Squad: {squadId}</h1>
            </div>
             <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4">
                <div className="flex flex-col items-center gap-1 text-center">
                    <Users2 className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-2xl font-bold tracking-tight">
                        Página de Detalhes do Squad
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                       Em breve, aqui você verá os membros, clientes e o desempenho deste squad.
                    </p>
                </div>
            </div>
        </div>
    )
}
