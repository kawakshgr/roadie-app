import Link from 'next/link'

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

export default function DateItem({ d, tourneeId }: { d: TourDate; tourneeId: string }) {
  const st = statusOf(d.jour)
  return (
    <Link
      href={`/dates/${d.id}`}
      className="dateitem glass"
      style={{ textDecoration: 'none', color: 'inherit' }}
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
  )
}