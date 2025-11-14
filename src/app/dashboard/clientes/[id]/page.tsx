'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClientDetailSheet } from '@/components/client-detail-sheet'

// Esta página agora serve apenas como um invólucro para abrir a ClientDetailSheet
export default function ClientDetailPageRedirect({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  const handleClose = () => {
    setIsOpen(false)
    // Atraso para permitir que a animação de fechamento da folha seja concluída antes de redirecionar
    setTimeout(() => {
      router.push('/dashboard/clientes')
    }, 300)
  }

  // O componente ClientDetailSheet é responsável por buscar seus próprios dados
  // com base no ID fornecido
  return (
    <ClientDetailSheet
      client={{ id: params.id } as Cliente} // Passa um objeto de cliente parcial apenas com o ID
      isOpen={isOpen}
      onClose={handleClose}
      onUpdate={() => {}} // A atualização é tratada dentro da folha
    />
  )
}
