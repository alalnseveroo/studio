
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSquad(name: string, clientIds: string[]) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { message: 'Usuário não autenticado.' } }
  }

  // Cria o Squad
  const { data: newSquad, error: squadError } = await supabase
    .from('squads')
    .insert({
      name,
      agency_id: user.id,
    })
    .select()
    .single()

  if (squadError) {
    console.error('Supabase error creating squad:', squadError)
    return { error: { message: `Não foi possível criar o squad: ${squadError.message}` } }
  }

  // Associa os clientes ao Squad, se houver
  if (clientIds && clientIds.length > 0) {
      const clientsToInsert = clientIds.map(clientId => ({
          squad_id: newSquad.id,
          client_id: clientId,
      }));

      const { error: clientsError } = await supabase
        .from('squad_clients')
        .insert(clientsToInsert);

      if (clientsError) {
          console.error('Supabase error adding clients to squad:', clientsError);
          // Opcional: deletar o squad criado se a associação de clientes falhar
          await supabase.from('squads').delete().eq('id', newSquad.id);
          return { error: { message: 'Não foi possível adicionar clientes ao squad.' } };
      }
  }

  revalidatePath('/dashboard/squads')
  return { data: newSquad, error: null }
}


export async function updateSquad(squadId: string, name: string, clientIds: string[]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: { message: 'Usuário não autenticado.' } };
    }

    // 1. Atualiza o nome do squad
    const { error: nameUpdateError } = await supabase
        .from('squads')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', squadId)
        .eq('agency_id', user.id);
    
    if (nameUpdateError) {
        return { error: { message: `Erro ao atualizar o nome do squad: ${nameUpdateError.message}`}};
    }

    // 2. Remove todos os clientes atuais do squad
    const { error: deleteError } = await supabase
        .from('squad_clients')
        .delete()
        .eq('squad_id', squadId);
    
    if (deleteError) {
        return { error: { message: `Erro ao remover clientes antigos: ${deleteError.message}`}};
    }

    // 3. Adiciona a nova lista de clientes
    if (clientIds && clientIds.length > 0) {
        const clientsToInsert = clientIds.map(clientId => ({
            squad_id: squadId,
            client_id: clientId
        }));

        const { error: insertError } = await supabase
            .from('squad_clients')
            .insert(clientsToInsert);
        
        if (insertError) {
            return { error: { message: `Erro ao adicionar novos clientes: ${insertError.message}`}};
        }
    }
    
    revalidatePath('/dashboard/squads');
    return { error: null };
}

export async function getSquads() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: 'Usuário não autenticado.' } };

    const { data, error } = await supabase
        .from('squads')
        .select(`
            *,
            squad_clients (
                clientes (*)
            )
        `)
        .eq('agency_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase error fetching squads:', error);
        return { data: null, error: { message: 'Não foi possível buscar os squads.' } };
    }

    return { data, error: null };
}

export async function getClientsNotInSquads() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: { message: 'Usuário não autenticado.' } };
    
    const { data, error } = await supabase.rpc('get_clients_not_in_squads', { p_agency_id: user.id });

    if (error) {
        console.error('Error fetching clients not in squads:', error);
        return { data: [], error: { message: 'Não foi possível buscar os clientes.' } };
    }
    return { data, error: null };
}
