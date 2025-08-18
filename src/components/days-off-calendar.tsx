
'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
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

  // Normaliza a data para evitar problemas com fuso horário
  const dateString = format(date, 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('days_off')
    .insert({ user_id: user.id, date: dateString })
    .select()
    .single()

  if (error) {
    // Ignora o erro se a data já existir
    if (error.code === '23505') { 
        console.log(`Day off for ${dateString} already exists.`);
        const { data: existingData } = await supabase.from('days_off').select().eq('user_id', user.id).eq('date', dateString).single();
        return existingData;
    }
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

  const handleSetDayOff = async (day: Date) => {
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
    <TooltipProvider>
      <div className="w-full">
        <Calendar
          locale={ptBR}
          className="w-full"
          month={month}
          onMonthChange={setMonth}
          modifiers={{
            holiday: holidayDates,
            dayOff: dayOffDates,
          }}
          modifiersClassNames={{
            holiday: 'relative',
            dayOff: 'bg-pink-100 text-pink-800 rounded-md',
          }}
          components={{
            DayContent: (props) => {
              const isHoliday = holidayDates.some(
                (holidayDate) => holidayDate.getDate() === props.date.getDate() && 
                                 holidayDate.getMonth() === props.date.getMonth() &&
                                 holidayDate.getFullYear() === props.date.getFullYear()
              );
              const holidayInfo = holidays.find(
                (h) => new Date(h.date + 'T00:00:00').toDateString() === props.date.toDateString()
              );

              if (isHoliday) {
                return (
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <div className="relative w-full h-full flex items-center justify-center">
                        {props.date.getDate()}
                        <div className="absolute bottom-1 w-1 h-1 bg-pink-500 rounded-full" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="w-auto">
                      <div className="flex items-center gap-4">
                          <p className="font-semibold">{holidayInfo?.name}</p>
                          <Button size="sm" onClick={() => handleSetDayOff(props.date)}>Folga</Button>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return <div className="relative">{props.date.getDate()}</div>
            },
          }}
        />
        <div className="px-4 pb-4 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span>Feriados e pontos facultativos</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-pink-100 rounded-sm" />
                <span>Optou por folga</span>
            </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
