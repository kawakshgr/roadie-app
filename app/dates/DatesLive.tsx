'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import DateItem from './DateItem'

type TourDate = {
  id: string; numero: number; ville: string; salle: string
  jour: string; horaires?: { set?: string; [k: string]: string | undefined }
}

export default function DatesLive({
  initial, tourneeId, peutEditer = false,
}: {
  initial: TourDate[]; tourneeId: string; peutEditer?: boolean
}) {
  const [dates, setDates] = useState<TourDate[]>(initial)
  const supabase = createClient()

  // recalcule les numéros selon l'ordre chronologique
  function renumeroter(liste: TourDate[]) {
    return [...liste]
      .sort((a, b) => a.jour.localeCompare(b.jour))
      .map((d, i) => ({ ...d, numero: i + 1 }))
  }

  useEffect(() => {
    const channel = supabase
      .channel(`dates-${tourneeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dates', filter: `tournee_id=eq.${tourneeId}` },
        (payload) => {
          setDates((cur) => {
            let next = cur
            if (payload.eventType === 'INSERT') {
              next = [...cur, payload.new as TourDate]
            } else if (payload.eventType === 'UPDATE') {
              next = cur.map((d) => (d.id === payload.new.id ? (payload.new as TourDate) : d))
            } else if (payload.eventType === 'DELETE') {
              next = cur.filter((d) => d.id !== payload.old.id)
            }
            return renumeroter(next)
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tourneeId])

  return (
    <div className="datelist">
      {dates.map((d) => <DateItem key={d.id} d={d} tourneeId={tourneeId} peutEditer={peutEditer} />)}
    </div>
  )
}