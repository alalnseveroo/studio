'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMessages(clientId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // No portal do cliente, o usuário não estará logado.
    // Vamos permitir a busca desde que a RLS esteja configurada corretamente.
    const { data: publicData, error: publicError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

    if (publicError) {
        console.error("Error fetching messages for client portal:", publicError);
        return { error: { message: 'Não foi possível carregar as mensagens.' } };
    }
    return { data: publicData };
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return { error: { message: 'Não foi possível carregar as mensagens.' } }
  }

  return { data, error: null }
}

export async function sendMessage({
  clientId,
  content,
  senderIsUser,
}: {
  clientId: string
  content: string
  senderIsUser: boolean
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let userId;

  if (senderIsUser) {
      if (!user) return { error: { message: 'Usuário não autenticado.' } }
      userId = user.id;
  } else {
      // Se quem envia é o cliente, precisamos buscar o user_id associado a esse cliente.
      const { data: clientData, error: clientError } = await supabase
        .from('clientes')
        .select('user_id')
        .eq('id', clientId)
        .single();
      
      if (clientError || !clientData) {
          return { error: { message: 'Não foi possível encontrar o destinatário.' } };
      }
      userId = clientData.user_id;
  }


  if (!content.trim()) {
    return { error: { message: 'A mensagem não pode estar vazia.' } }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      client_id: clientId,
      content,
      sender_is_user: senderIsUser,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return { error: { message: 'Não foi possível enviar a mensagem.' } }
  }

  // A revalidação não é estritamente necessária com o real-time, mas é uma boa prática.
  revalidatePath(`/dashboard/clientes/${clientId}`)
  revalidatePath(`/portal/${clientId}`)
  
  return { data, error: null }
}
