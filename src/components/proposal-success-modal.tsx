
'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Plus, Link, FileSignature, ArrowRight, Badge } from 'lucide-react'
import { CreateContractModal } from './create-contract-modal'
import { getClients } from '@/lib/actions/clients'
import { getProposals } from '@/lib/actions/propostas'
import type { Cliente, Proposta } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface ActionCardProps {
  icon: React.ElementType
  title: string
  description: string
  onClick: () => void
  isRecommended?: boolean
}

const ActionCard: React.FC<ActionCardProps> = ({ icon: Icon, title, description, onClick, isRecommended }) => (
  <button
    onClick={onClick}
    className="relative group w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all"
  >
    {isRecommended && (
        <Badge className="absolute -top-2 -right-2">Recomendado</Badge>
    )}
    <div className="flex items-start gap-4">
      <div className="p-3 bg-muted rounded-lg">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
       <ArrowRight className="h-5 w-5 text-muted-foreground self-center transform-gpu transition-transform group-hover:translate-x-1" />
    </div>
  </button>
)

interface ProposalSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateAnother: () => void
  proposal: Proposta | null
}

export function ProposalSuccessModal({ isOpen, onClose, onCreateAnother, proposal }: ProposalSuccessModalProps) {
  const [isContractModalOpen, setIsContractModalOpen] = React.useState(false)
  const [clients, setClients] = React.useState<Cliente[]>([])
  const [proposals, setProposals] = React.useState<Proposta[]>([])
  const router = useRouter()

  React.useEffect(() => {
    if (isContractModalOpen) {
      const fetchData = async () => {
        const [{data: clientData}, {data: proposalData}] = await Promise.all([
          getClients(),
          getProposals()
        ]);
        setClients(clientData || []);
        setProposals(proposalData || []);
      }
      fetchData()
    }
  }, [isContractModalOpen])

  const handleLinkToClient = () => {
    onClose()
    router.push('/dashboard/clientes')
  }

  const handleCreateContract = () => {
    onClose()
    setIsContractModalOpen(true)
  }
  
  const handleModalClose = () => {
      onClose();
      router.push('/dashboard/clientes');
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleModalClose(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="items-center text-center">
            <Image
              src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Untitled%20folder/Zero%20Tasks%203.png"
              alt="Proposta Criada"
              width={120}
              height={120}
              className="mb-4"
            />
            <DialogTitle className="text-2xl">Proposta Criada!</DialogTitle>
            <DialogDescription>
              O que você gostaria de fazer agora? Escolha uma das opções abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
             <ActionCard 
                icon={Plus}
                title="Criar Outra Proposta"
                description="Continue no fluxo e crie um novo modelo de proposta."
                onClick={onCreateAnother}
             />
             <ActionCard 
                icon={Link}
                title="Vincular a Cliente"
                description="Associe esta proposta a um cliente existente para cobranças."
                onClick={handleLinkToClient}
             />
             <ActionCard 
                icon={FileSignature}
                title="Gerar Contrato"
                description="Use esta proposta para gerar um contrato para um cliente."
                onClick={handleCreateContract}
                isRecommended
             />
          </div>
          
          <DialogFooter>
             <Button variant="ghost" onClick={handleModalClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <CreateContractModal
          isOpen={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
          clients={clients}
          proposals={proposals}
          onClientListChange={setClients}
          onContractAdded={() => setIsContractModalOpen(false)} 
          selectedProposalId={proposal?.id}
      />
    </>
  )
}
