'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AddDate({ tourneeId }: { tourneeId: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [f, setF] = useState({
    ville: '', salle: '', pays: '', jour: '',
    load: '', soundcheck: '', doors: '', set: '', curfew: '',
  })
  const supabase = createClient()
  const router = useRouter()

  function set(k: string, v: string) {
    setF((cur) => ({ ...cur, [k]: v }))
  }

  async function ajouter() {
    if (!f.ville.trim() || !f.jour) {
      setMsg('Ville et date sont obligatoires')
      return
    }
    setBusy(true)
    setMsg('Géocodage…')

    // géocoder la ville
    let lat: number | null = null
    let lng: number | null = null
    try {
      const { data } = await supabase.functions.invoke('geocode', {
        body: { villes: [`${f.ville}, ${f.pays}`] },
      })
      const c = data?.results?.[`${f.ville}, ${f.pays}`]
      if (c) { lat = c.lat; lng = c.lng }
    } catch {
      // on insère quand même sans coordonnées
    }

    setMsg('Ajout…')
    const { error } = await supabase.from('dates').insert({
      tournee_id: tourneeId,
      ville: f.ville.trim(),
      salle: f.salle.trim(),
      pays: f.pays.trim().toUpperCase(),
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
    setF({ ville: '', salle: '', pays: '', jour: '', load: '', soundcheck: '', doors: '', set: '', curfew: '' })
    router.refresh()
    setTimeout(() => { setOpen(false); setMsg('') }, 1000)
  }

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
              <input className="login-input" placeholder="Ville *" value={f.ville} onChange={(e) => set('ville', e.target.value)} />
              <input className="login-input" placeholder="Salle" value={f.salle} onChange={(e) => set('salle', e.target.value)} />
              <input className="login-input" placeholder="Pays (ex: FR)" value={f.pays} onChange={(e) => set('pays', e.target.value)} />
              <input className="login-input" type="date" value={f.jour} onChange={(e) => set('jour', e.target.value)} />

              <div className="add-times">
                <input className="login-input" placeholder="Load-in" value={f.load} onChange={(e) => set('load', e.target.value)} />
                <input className="login-input" placeholder="Soundcheck" value={f.soundcheck} onChange={(e) => set('soundcheck', e.target.value)} />
                <input className="login-input" placeholder="Doors" value={f.doors} onChange={(e) => set('doors', e.target.value)} />
                <input className="login-input" placeholder="Set" value={f.set} onChange={(e) => set('set', e.target.value)} />
                <input className="login-input" placeholder="Curfew" value={f.curfew} onChange={(e) => set('curfew', e.target.value)} />
              </div>

              {msg && <p style={{ fontSize: 14, marginTop: 8 }}>{msg}</p>}
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