'use client'
import { useState, useEffect, useRef } from 'react'

export type LieuChoisi = {
  salle: string      // nom du lieu si c'en est un (sinon vide)
  ville: string
  pays: string
  adresse: string
  lat: number
  lng: number
}

export default function LieuAutocomplete({
  valeur, onValeurChange, onSelect,
}: {
  valeur: string
  onValeurChange: (v: string) => void
  onSelect: (l: LieuChoisi) => void
}) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function onChange(v: string) {
    onValeurChange(v)
    if (timer.current) clearTimeout(timer.current)
    if (v.trim().length < 3) { setSuggestions([]); setOpen(false); return }

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(v)}`
        const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } })
        const data = await res.json()
        setSuggestions(data)
        setOpen(true)
      } catch {
        setSuggestions([])
      }
      setLoading(false)
    }, 400)
  }

  function libelle(item: any): { titre: string; detail: string } {
    const a = item.address ?? {}
    const ville = a.city || a.town || a.village || a.municipality || ''
    // si le résultat est un lieu nommé (salle, théâtre…), item.name est rempli
    const nomLieu = item.name && item.name !== ville ? item.name : ''
    const titre = nomLieu || ville || item.display_name.split(',')[0]
    return { titre, detail: item.display_name }
  }

  function choisir(item: any) {
    const a = item.address ?? {}
    const ville = a.city || a.town || a.village || a.municipality || ''
    const nomLieu = item.name && item.name !== ville ? item.name : ''
    // adresse lisible : numéro + rue + code postal + ville
    const morceaux = [
      [a.house_number, a.road].filter(Boolean).join(' '),
      [a.postcode, ville].filter(Boolean).join(' '),
    ].filter(Boolean)
    const adresse = morceaux.join(', ')

    onSelect({
      salle: nomLieu,
      ville,
      pays: (a.country_code || '').toUpperCase(),
      adresse,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    })
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        className="login-input"
        placeholder="Tape une salle ou une ville…"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (suggestions.length) setOpen(true) }}
        autoComplete="off"
      />
      {loading && (
        <div style={{ position: 'absolute', right: 14, top: 14, fontSize: 13, color: 'var(--ink-faint)' }}>…</div>
      )}
      {open && suggestions.length > 0 && (
        <div className="autocomplete-list glass">
          {suggestions.map((item, i) => {
            const { titre, detail } = libelle(item)
            return (
              <div key={i} className="autocomplete-item" onClick={() => choisir(item)}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{titre}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}