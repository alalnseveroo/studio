

'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
      <div className="w-full p-4">
        <Calendar
          locale={ptBR}
          className="w-full"
          month={month}
          onMonthChange={setMonth}
          onDayClick={handleSetDayOff}
          modifiers={{
            holiday: holidayDates,
            dayOff: dayOffDates,
          }}
          classNames={{
            root: '[--day-bg:transparent] [--day-fg:white] [--day-border:transparent] [--day-today-bg:transparent] [--day-today-fg:white] [--day-today-border:white] [--day-active-bg:#000] [--day-active-fg:#fff] [--day-disabled-fg:#fff5] [--day-disabled-bg:transparent] [--day-outside-fg:#fff5] [--day-outside-bg:transparent] [--day-hover-bg:#0005] [--day-hover-fg:white] [--day-range-fg:#fff] [--day-range-bg:#0005] [--head-fg:white] [--nav-fg:white] [--nav-disabled-fg:#fff5] w-full border-none p-0',
            table: 'w-full',
            row: 'flex w-full mt-1',
            head_row: 'flex w-full',
            head_cell: 'w-full text-center text-xs font-light text-[var(--head-fg)]',
            cell: 'w-full text-center',
            day: 'h-8 w-8 rounded-full text-[var(--day-fg)] bg-[var(--day-bg)] border border-[var(--day-border)] hover:text-[var(--day-hover-fg)] hover:bg-[var(--day-hover-bg)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white',
            day_today: '!border-[var(--day-today-border)]',
            day_selected: '!text-[var(--day-active-fg)] !bg-[var(--day-active-bg)]',
            day_disabled: '!text-[var(--day-disabled-fg)] !bg-[var(--day-disabled-bg)] cursor-not-allowed',
            day_outside: '!text-[var(--day-outside-fg)] !bg-[var(--day-outside-bg)]',
            day_range_middle: '!text-[var(--day-range-fg)] !bg-[var(--day-range-bg)]',
            nav_button: 'h-6 w-6 text-[var(--nav-fg)] hover:text-white hover:bg-[#0005] disabled:text-[var(--nav-disabled-fg)]',
            caption: 'flex justify-between items-center px-2 py-1',
            caption_label: 'text-sm font-medium',
            nav: 'flex items-center gap-1',
          }}
          modifiersClassNames={{
            holiday: 'relative',
            dayOff: '!bg-black/90 !text-white',
          }}
          components={{
            DayContent: (props) => {
              const holidayInfo = holidays.find(
                (h) => new Date(h.date + 'T00:00:00').toDateString() === props.date.toDateString()
              );

              if (holidayInfo) {
                return (
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <div className="relative w-full h-full flex items-center justify-center">
                        {props.date.getDate()}
                        <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="w-auto bg-black text-white border-none">
                      <p className="font-semibold">{holidayInfo?.name}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return <div className="relative flex items-center justify-center w-full h-full">{props.date.getDate()}</div>
            },
          }}
        />
        <div className="pt-4 text-xs text-white space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                <span>Feriados e pontos facultativos</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-black/90 rounded-sm border border-white" />
                <span>Optou por folga</span>
            </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
