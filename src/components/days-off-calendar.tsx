

'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import type { Holiday, DayOff } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

async function getHolidays(): Promise<Holiday[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('holidays').select('*')
  if (error) {
    console.error('Error fetching holidays:', error.message)
    return []
  }
  return data
}

async function getDaysOff(): Promise<DayOff[]> {
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

async function addDayOff(date: Date): Promise<DayOff | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dateString = format(date, 'yyyy-MM-dd')

  const { data: existingData, error: fetchError } = await supabase.from('days_off').select().eq('user_id', user.id).eq('date', dateString).maybeSingle();

  if(fetchError && fetchError.code !== 'PGRST116') { // Ignore 'not found' error
    console.error('Error checking for existing day off:', fetchError.message)
    return null;
  }
  
  if (existingData) {
      console.log(`Day off for ${dateString} already exists.`);
      return existingData;
  }

  const { data, error } = await supabase
    .from('days_off')
    .insert({ user_id: user.id, date: dateString })
    .select()
    .single()

  if (error) {
    console.error('Error adding day off:', error.message)
    return null
  }
  return data
}

export function DaysOffCalendar() {
  const [holidays, setHolidays] = React.useState<Holiday[]>([])
  const [daysOff, setDaysOff] = React.useState<DayOff[]>([])
  const [month, setMonth] = React.useState<Date>(new Date())
  const { toast } = useToast()

  React.useEffect(() => {
    const fetchData = async () => {
      const [holidaysData, daysOffData] = await Promise.all([getHolidays(), getDaysOff()])
      setHolidays(holidaysData)
      setDaysOff(daysOffData)
    }
    fetchData()
  }, [])

  const handleSetDayOff = async (day: Date | undefined) => {
    if (!day) return;
    
    // Check if the day is already a day off
    const isAlreadyDayOff = daysOff.some(
        d => format(parseISO(d.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );

    if (isAlreadyDayOff) {
        toast({
            title: 'Dia já registrado',
            description: 'Este dia já está marcado como folga.',
        })
        return;
    }

    const newDayOff = await addDayOff(day)
    if (newDayOff) {
      setDaysOff((prev) => [...prev, newDayOff])
      toast({
        title: 'Folga registrada!',
        description: `${format(day, 'dd/MM/yyyy')} foi marcado como folga.`,
      })
    } else {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível registrar a folga.',
        })
    }
  }

  const holidayDates = React.useMemo(() => holidays.map(h => new Date(h.date + 'T00:00:00')), [holidays])
  const dayOffDates = React.useMemo(() => daysOff.map(d => parseISO(d.date)), [daysOff])

  return (
      <div className="w-full">
        <Calendar
          locale={ptBR}
          mode="single"
          month={month}
          onMonthChange={setMonth}
          onDayClick={handleSetDayOff}
          modifiers={{
            holiday: holidayDates,
            dayOff: dayOffDates,
          }}
          modifiersClassNames={{
            dayOff: 'bg-pink-100 !text-pink-800 rounded-md font-semibold',
            holiday: 'relative text-muted-foreground',
          }}
          classNames={{
            root: "p-0",
            caption_label: "text-sm font-medium text-white",
            nav_button: "h-7 w-7",
            nav_button_previous: "absolute left-1 text-white",
            nav_button_next: "absolute right-1 text-white",
            head_row: "flex w-full mt-2",
            head_cell: "text-white/80 rounded-md w-8 font-normal text-[0.75rem] flex-1 justify-center text-center",
            row: "flex w-full mt-2",
            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 text-white text-xs",
            day_selected: "bg-pink-200 text-pink-800 hover:bg-pink-300 focus:bg-pink-300",
            day_today: "bg-white/20 text-white",
          }}
           components={{
            DayContent: (props) => {
              const isHoliday = holidayDates.some(
                (holidayDate) => holidayDate.getDate() === props.date.getDate() && 
                                 holidayDate.getMonth() === props.date.getMonth() &&
                                 holidayDate.getFullYear() === props.date.getFullYear()
              );

              if (isHoliday) {
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {props.date.getDate()}
                    <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />
                  </div>
                )
              }
              return <div className="relative flex items-center justify-center w-full h-full">{props.date.getDate()}</div>
            },
          }}
        />
        <div className="p-4 pt-2 text-xs text-white/80 space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                <span>Feriados e pontos facultativos</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-pink-100 rounded-sm" />
                <span>Folga registrada por você</span>
            </div>
        </div>
      </div>
  )
}
