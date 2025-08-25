
'use client'

import { motion } from 'framer-motion'
import { X, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatInterface } from './chat-interface'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'

interface PublicChatModalProps {
  assistant: {
    id: number;
    userId: string;
    nome: string;
    foto?: string;
  }
  onClose: () => void
}

export function PublicChatModal({ assistant, onClose }: PublicChatModalProps) {
  
  // Como o visitante não tem um ID de cliente, podemos usar um ID temporário 
  // para a `ChatInterface`. A lógica no backend precisará ser adaptada
  // para lidar com esses chats de "prospects".
  const prospectChatId = `prospect-${assistant.userId}-${localStorage.getItem('prospect-session-id') || 'new'}`;


  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        layoutId={`chat-card-${assistant.id}`}
        className="w-[350px] h-[500px]"
        onClick={(e) => e.stopPropagation()} // Impede que o clique feche o modal
      >
        <Card className="w-full h-full flex flex-col shadow-2xl rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                   <Avatar className="w-10 h-10 border-2 border-primary">
                        <AvatarImage src={assistant.foto || ''} alt={assistant.nome} />
                        <AvatarFallback>{assistant.nome.charAt(0)}</AvatarFallback>
                   </Avatar>
                  <CardTitle className="text-base">{assistant.nome}</CardTitle>
              </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar chat</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {/* 
              A `ChatInterface` atual é baseada em `clientId`.
              Para um chat público, precisaríamos de uma nova lógica.
              Por enquanto, vamos usar um identificador de placeholder.
            */}
            <ChatInterface clientId={prospectChatId} isUser={false} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
