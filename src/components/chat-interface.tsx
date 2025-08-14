'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMessages, sendMessage } from '@/lib/actions/chat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { User } from '@supabase/supabase-js'

type Message = {
  id: string
  created_at: string
  content: string
  sender_is_user: boolean
}

interface ChatInterfaceProps {
  clientId: string
  isUser: boolean // Flag to determine if the current viewer is the service provider
  currentUser?: User | null // Pass the logged-in user if available
}

export function ChatInterface({ clientId, isUser, currentUser }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true)
      const { data, error } = await getMessages(clientId)
      if (data) {
        setMessages(data)
      }
      setIsLoading(false)
    }
    fetchMessages()
  }, [clientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`chat-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSending(true)
    await sendMessage({
      clientId: clientId,
      content: newMessage,
      senderIsUser: isUser,
    })
    setNewMessage('')
    setIsSending(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-lg border">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex items-end gap-2', msg.sender_is_user ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-xs rounded-lg px-3 py-2 md:max-w-md',
                msg.sender_is_user ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="mt-1 text-right text-xs opacity-70">
                {format(new Date(msg.created_at), 'HH:mm')}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t bg-background p-4">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 resize-none"
          rows={1}
          onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
              }
          }}
        />
        <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
    </div>
  )
}
