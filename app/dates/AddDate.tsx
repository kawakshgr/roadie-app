'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PaysSelect from './PaysSelect'
import LieuAutocomplete from './LieuAutocomplete'

export default function AddDate({ tourneeId }: { tourneeId: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [f, setF] = useState({
    recherche: '', ville: '', salle: '', pays: '', adresse: '', jour: '',
    load: '', soundcheck: '', doors: '', set: '', curfew: '',
  })
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  function set(k: string, v: string) {
    setF((cur) => ({ ...cur, [k]: v }))
  }

  async function ajouter() {
    if (!f.ville.trim() || !f.jour) {
      setMsg('La date et la ville sont obligatoires')
      return
    }
    setBusy(true)

    let lat = coords?.lat ?? null
    let lng = coords?.lng ?? null

    if (lat == null || lng == null) {
      setMsg('Géocodage…')
      try {
        const { data } = await supabase.functions.invoke('geocode', {
          body: { villes: [`${f.ville}, ${f.pays}`] },
        })
        const c = data?.results?.[`${f.ville}, ${f.pays}`]
        if (c) { lat = c.lat; lng = c.lng }
      } catch { /* insertion sans coords */ }
    }

    setMsg('Ajout…')
    const { error } = await supabase.from('dates').insert({
      tournee_id: tourneeId,
      ville: f.ville.trim(),
      salle: f.salle.trim(),
      pays: f.pays.trim().toUpperCase(),
      adresse: f.adresse.trim() || null,
      jour: f.jour,
      lat,
      lng,
      horaires: {
        load: f.load, soundcheck: f.soundcheck,
        doors: f.doors, set: f.set, curfew: f.curfew,
      },
    })
    setBusy(false)

    if (error) { setMsg('Erreur : ' + error.message); return }
    setMsg('✓ Date ajoutée')
    setF({ recherche: '', ville: '', salle: '', pays: '', adresse: '', jour: '', load: '', soundcheck: '', doors: '', set: '', curfew: '' })
    setCoords(null)
    router.refresh()
    setTimeout(() => { setOpen(false); setMsg('') }, 1000)
  }

  const labelStyle = { fontSize: 12, color: 'var(--ink-dim)', fontWeight: 600, margin: '0 4px 6px' } as const
  const sectionStyle = { fontSize: 13, color: 'var(--ink-dim)', fontWeight: 600, margin: '16px 4px 8px' } as const

  return (
    <>
      <button className="add-btn" onClick={() => setOpen(true)} aria-label="Ajouter une date">+</button>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Ajouter une date</h2>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={labelStyle}>Date du concert *</div>
              <input className="login-input" type="date" value={f.jour} onChange={(e) => set('jour', e.target.value)} />

              <div style={labelStyle}>Rechercher une salle ou une ville</div>
              <LieuAutocomplete
                valeur={f.recherche}
                onValeurChange={(v) => { set('recherche', v); setCoords(null) }}
                onSelect={(l) => {
                  setF((cur) => ({
                    ...cur,
                    recherche: l.salle || l.ville,
                    salle: l.salle || cur.salle,
                    ville: l.ville || cur.ville,
                    pays: l.pays || cur.pays,
                    adresse: l.adresse || cur.adresse,
                  }))
                  setCoords({ lat: l.lat, lng: l.lng })
                }}
              />

              <div style={sectionStyle}>Détails du lieu</div>

              <div style={labelStyle}>Ville *</div>
              <input className="login-input" placeholder="Ex : Paris" value={f.ville} onChange={(e) => set('ville', e.target.value)} />

              <div style={labelStyle}>Salle</div>
              <input className="login-input" placeholder="Ex : Olympia" value={f.salle} onChange={(e) => set('salle', e.target.value)} />

              <div style={labelStyle}>Adresse</div>
              <input className="login-input" placeholder="Ex : 28 Bd des Capucines, 75009 Paris" value={f.adresse} onChange={(e) => set('adresse', e.target.value)} />

              <div style={labelStyle}>Pays</div>
              <PaysSelect value={f.pays} onChange={(code) => set('pays', code)} />

              <div style={sectionStyle}>Horaires de la journée</div>
              <div className="add-times">
                <div>
                  <div style={labelStyle}>Load-in</div>
                  <input className="login-input" type="time" value={f.load} onChange={(e) => set('load', e.target.value)} />
                </div>
                <div>
                  <div style={labelStyle}>Soundcheck</div>
                  <input className="login-input" type="time" value={f.soundcheck} onChange={(e) => set('soundcheck', e.target.value)} />
                </div>
                <div>
                  <div style={labelStyle}>Doors</div>
                  <input className="login-input" type="time" value={f.doors} onChange={(e) => set('doors', e.target.value)} />
                </div>
                <div>
                  <div style={labelStyle}>Set</div>
                  <input className="login-input" type="time" value={f.set} onChange={(e) => set('set', e.target.value)} />
                </div>
                <div>
                  <div style={labelStyle}>Curfew</div>
                  <input className="login-input" type="time" value={f.curfew} onChange={(e) => set('curfew', e.target.value)} />
                </div>
              </div>

              {msg && <p style={{ fontSize: 14, marginTop: 12, color: msg.startsWith('✓') ? 'var(--green)' : msg.startsWith('Erreur') ? 'var(--red)' : 'var(--ink-dim)' }}>{msg}</p>}
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn-primary" onClick={ajouter} disabled={busy}>
                {busy ? '…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}