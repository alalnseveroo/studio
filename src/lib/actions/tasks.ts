
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTasks() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: { message: 'Usuário não autenticado.' } }
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*, clientes(full_name, company_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error)
    return { data: null, error: { message: 'Não foi possível buscar as tarefas.' } }
  }

  return { data, error: null }
}

export async function createTask(description: string, client_id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } }
  }
  
  if (!description.trim()) {
      return { error: { message: 'A descrição da tarefa não pode estar vazia.' } }
  }

  const { error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      client_id,
      description,
    });

  if (error) {
    console.error('Error creating task:', error)
    return { error: { message: 'Não foi possível criar a tarefa.' } }
  }

  revalidatePath('/dashboard')
  return { error: null }
}

export async function updateTask(id: string, is_completed: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } }
  }

  const { error } = await supabase
    .from('tasks')
    .update({ is_completed, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating task:', error)
    return { error: { message: 'Não foi possível atualizar a tarefa.' } }
  }

  revalidatePath('/dashboard')
  return { error: null }
}
