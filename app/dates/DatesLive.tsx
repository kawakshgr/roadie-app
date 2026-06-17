'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import DateItem from './DateItem'

type TourDate = {
  id: string; numero: number; ville: string; salle: string
  jour: string; horaires?: { set?: string; [k: string]: string | undefined }
}

export default function DatesLive({
  initial, tourneeId,
}: {
  initial: TourDate[]; tourneeId: string
}) {
  const [dates, setDates] = useState<TourDate[]>(initial)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`dates-${tourneeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dates', filter: `tournee_id=eq.${tourneeId}` },
        (payload) => {
          setDates((cur) => {
            if (payload.eventType === 'INSERT') {
              return [...cur, payload.new as TourDate].sort((a, b) => a.jour.localeCompare(b.jour))
            }
            if (payload.eventType === 'UPDATE') {
              return cur.map((d) => (d.id === payload.new.id ? (payload.new as TourDate) : d))
            }
            if (payload.eventType === 'DELETE') {
              return cur.filter((d) => d.id !== payload.old.id)
            }
            return cur
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tourneeId])

  return (
    <div className="datelist">
      {dates.map((d) => <DateItem key={d.id} d={d} tourneeId={tourneeId} />)}
    </div>
  )
}