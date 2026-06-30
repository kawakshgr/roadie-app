'use client'
import { dureeMinutes, formatDuree } from './horaires'

export default function PlageHoraire({
  label, debut, fin, onDebut, onFin,
}: {
  label: string
  debut: string
  fin: string
  onDebut: (v: string) => void
  onFin: (v: string) => void
}) {
  const duree = formatDuree(dureeMinutes(debut, fin))
  const labelStyle = { fontSize: 12, color: 'var(--ink-dim)', fontWeight: 600, margin: '0 4px 6px' } as const

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={labelStyle}>
        {label}{duree && <span style={{ color: 'var(--accent)', marginLeft: 8 }}>· {duree}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="login-input" type="time" value={debut} onChange={(e) => onDebut(e.target.value)} style={{ flex: 1, marginBottom: 0 }} />
        <span style={{ color: 'var(--ink-faint)' }}>→</span>
        <input className="login-input" type="time" value={fin} onChange={(e) => onFin(e.target.value)} style={{ flex: 1, marginBottom: 0 }} />
      </div>
    </div>
  )
}