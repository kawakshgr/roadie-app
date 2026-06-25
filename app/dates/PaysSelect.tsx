'use client'
import { PAYS_COURANTS, PAYS_TOUS } from './pays'

export default function PaysSelect({
  value, onChange,
}: {
  value: string; onChange: (code: string) => void
}) {
  return (
    <select className="login-input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— Choisir un pays —</option>
      <optgroup label="Courants">
        {PAYS_COURANTS.map((p) => (
          <option key={p.code} value={p.code}>{p.nom}</option>
        ))}
      </optgroup>
      <optgroup label="Tous les pays">
        {PAYS_TOUS.map((p) => (
          <option key={p.code} value={p.code}>{p.nom}</option>
        ))}
      </optgroup>
    </select>
  )
}