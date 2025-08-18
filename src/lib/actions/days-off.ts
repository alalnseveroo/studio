
'use server'

import { createClient } from '@/lib/supabase/server'
import type { Holiday, DayOff } from '@/lib/types'
import { parseISO } from 'date-fns'

export async function getHolidays(): Promise<Holiday[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('holidays').select('*')
  if (error) {
    console.error('Error fetching holidays:', error.message)
    return []
  }
  return data
}

export async function getDaysOff(): Promise<DayOff[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase.from('days_off').select('*').eq('user_id', user.id)
  if (error) {
    console.error('Error fetching days off:', error.message)
    return []
  }
  return data
}

export async function getDaysOffByUserId(userId: string): Promise<DayOff[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('days_off')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching days off for user:', userId, error.message);
    return [];
  }
  return data;
}
