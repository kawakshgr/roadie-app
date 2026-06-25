'use client'
import { useState, useEffect, useRef } from 'react'

type Suggestion = {
  display: string
  ville: string
  pays: string
  lat: number
  lng: number
}

export default function VilleAutocomplete({
  ville, onSelect, onVilleChange,
}: {
  ville: string
  onSelect: (s: Suggestion) => void
  onVilleChange: (v: string) => void
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // ferme la liste si on clique ailleurs
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function onChange(v: string) {
    onVilleChange(v)
    if (timer.current) clearTimeout(timer.current)
    if (v.trim().length < 3) { setSuggestions([]); setOpen(false); return }

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&city=${encodeURIComponent(v)}`
        const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } })
        const data = await res.json()
        const sugg: Suggestion[] = data.map((item: any) => {
          const a = item.address ?? {}
          const villeNom = a.city || a.town || a.village || a.municipality || item.name || v
          const paysCode = (a.country_code || '').toUpperCase()
          return {
            display: item.display_name,
            ville: villeNom,
            pays: paysCode,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }
        })
        setSuggestions(sugg)
        setOpen(true)
      } catch {
        setSuggestions([])
      }
      setLoading(false)
    }, 400)
  }

  function choisir(s: Suggestion) {
    onSelect(s)
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        className="login-input"
        placeholder="Ex : Paris"
        value={ville}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (suggestions.length) setOpen(true) }}
        autoComplete="off"
      />
      {loading && (
        <div style={{ position: 'absolute', right: 14, top: 14, fontSize: 13, color: 'var(--ink-faint)' }}>…</div>
      )}
      {open && suggestions.length > 0 && (
        <div className="autocomplete-list glass">
          {suggestions.map((s, i) => (
            <div key={i} className="autocomplete-item" onClick={() => choisir(s)}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.ville}{s.pays ? `, ${s.pays}` : ''}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.display}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}