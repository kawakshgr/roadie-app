'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Transport = {
  id: string
  user_id: string
  type: string
  compagnie: string | null
  numero_reservation: string | null
  depart_lieu: string | null
  depart_heure: string | null
  arrivee_lieu: string | null
  arrivee_heure: string | null
}

const ICONS: Record<string, string> = { train: '🚆', avion: '✈️', van: '🚐', autre: '🚗' }

export default function TransportItem({
  t, nom, isTM,
}: {
  t: Transport; nom: string; isTM: boolean
}) {
  const supabase = createClient()
  const router = useRouter()

  async function supprimer() {
    if (!confirm('Supprimer ce transport ?')) return
    const { error } = await supabase.from('transports').delete().eq('id', t.id)
    if (error) alert(error.message)
    else router.refresh()
  }

  const trajet = [t.depart_lieu, t.arrivee_lieu].filter(Boolean).join(' → ')
  const heures = [t.depart_heure, t.arrivee_heure].filter(Boolean).join(' → ')

  return (
    <div className="card glass">
      <div className="ic">{ICONS[t.type] ?? '🚗'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h">{nom} · {t.type}{t.compagnie ? ` (${t.compagnie})` : ''}</div>
        <div className="d">
          {trajet && <span>{trajet}</span>}
          {trajet && heures && <span> · </span>}
          {heures && <span>{heures}</span>}
          {t.numero_reservation && <span> · Réf : {t.numero_reservation}</span>}
        </div>
      </div>
      {isTM && (
        <button className="membre-remove" onClick={supprimer} aria-label="Supprimer">×</button>
      )}
    </div>
  )
}