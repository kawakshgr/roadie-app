'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type TourDate = {
  id: string
  numero: number
  ville: string
  salle: string
  jour: string
  horaires?: { set?: string; [k: string]: string | undefined }
}

function statusOf(jour: string) {
  const today = '2026-07-14'
  return jour < today ? 'past' : jour === today ? 'today' : 'future'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function DateItem({
  d, tourneeId, peutEditer = false,
}: {
  d: TourDate; tourneeId: string; peutEditer?: boolean
}) {
  const st = statusOf(d.jour)
  const supabase = createClient()
  const router = useRouter()

  async function supprimer(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Supprimer la date ${d.ville} ?`)) return
    const { error } = await supabase.from('dates').delete().eq('id', d.id)
    if (error) alert(error.message)
    else router.refresh()
  }

  return (
    <div className="row-with-action">
      <Link
        href={`/dates/${d.id}`}
        className="dateitem glass"
        style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
      >
        <div className={`num ${st}`}>{d.numero}</div>
        <div style={{ flex: 1 }}>
          <div className="city">{d.ville} · {d.salle}</div>
          <div className="meta">
            {fmtDate(d.jour)}{st === 'today' && ` · set ${d.horaires?.set} — aujourd'hui`}
          </div>
        </div>
        <div style={{ color: 'var(--ink-faint)', fontSize: 20 }}>›</div>
      </Link>
      {peutEditer && (
        <button className="delete-btn" onClick={supprimer} aria-label="Supprimer la date">🗑</button>
      )}
    </div>
  )
}