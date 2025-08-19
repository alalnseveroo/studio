
'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { getHolidays, getDaysOffByUserId } from '@/lib/actions/days-off'
import type { Holiday, DayOff } from '@/lib/types'
import { parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PortalCalendarProps {
  providerId: string
}

export function PortalCalendar({ providerId }: PortalCalendarProps) {
  const [holidays, setHolidays] = React.useState<Holiday[]>([])
  const [daysOff, setDaysOff] = React.useState<DayOff[]>([])
  const [month, setMonth] = React.useState<Date>(new Date())

  React.useEffect(() => {
    const fetchData = async () => {
      const [holidaysData, daysOffData] = await Promise.all([
        getHolidays(),
        getDaysOffByUserId(providerId),
      ])
      setHolidays(holidaysData)
      setDaysOff(daysOffData)
    }
    fetchData()
  }, [providerId])

  const holidayDates = React.useMemo(() => holidays.map(h => new Date(h.date + 'T00:00:00')), [holidays])
  const dayOffDates = React.useMemo(() => daysOff.map(d => parseISO(d.date)), [daysOff])

  return (
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
            dayOff: 'bg-pink-100 text-pink-800 rounded-md !text-pink-800 font-semibold',
            holiday: 'relative text-muted-foreground',
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
                    <div className="absolute bottom-1 w-1 h-1 bg-pink-500 rounded-full" />
                  </div>
                )
              }
              return <div className="relative flex items-center justify-center w-full h-full">{props.date.getDate()}</div>
            },
          }}
        />
        <div className="pt-4 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span>Feriados e pontos facultativos</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-pink-100 rounded-sm" />
                <span>Assistente em folga</span>
            </div>
        </div>
      </div>
  )
}
