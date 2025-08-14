
'use client'

import { X, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChatInterface } from './chat-interface'
import type { Cliente } from '@/lib/types'

interface ChatModalProps {
  client: Cliente
  onClose: () => void
}

export function ChatModal({ client, onClose }: ChatModalProps) {
  const clientName = client.full_name || client.company_name || 'Cliente'

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 h-[500px] flex flex-col shadow-2xl rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
                 <MessageSquare className="h-5 w-5" />
                <div className="space-y-0">
                    <CardTitle className="text-base">{clientName}</CardTitle>
                </div>
            </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar chat</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <ChatInterface clientId={client.id} isUser={true} />
        </CardContent>
      </Card>
    </div>
  )
}
