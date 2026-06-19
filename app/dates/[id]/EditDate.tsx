'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type DateData = {
  id: string
  ville: string
  salle: string | null
  pays: string | null
  jour: string
  km_prochaine: number | null
  depart_hotel: string | null
  horaires: Record<string, string> | null
}

export default function EditDate({ d }: { d: DateData }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const h = d.horaires ?? {}
  const [f, setF] = useState({
    ville: d.ville ?? '',
    salle: d.salle ?? '',
    pays: d.pays ?? '',
    jour: d.jour ?? '',
    km_prochaine: d.km_prochaine != null ? String(d.km_prochaine) : '',
    depart_hotel: d.depart_hotel ?? '',
    load: h.load ?? '',
    soundcheck: h.soundcheck ?? '',
    doors: h.doors ?? '',
    set: h.set ?? '',
    curfew: h.curfew ?? '',
  })
  const supabase = createClient()
  const router = useRouter()

  function set(k: string, v: string) {
    setF((cur) => ({ ...cur, [k]: v }))
  }

  async function enregistrer() {
    if (!f.ville.trim() || !f.jour) { setMsg('Ville et date obligatoires'); return }
    setBusy(true); setMsg('')

    const { error } = await supabase
      .from('dates')
      .update({
        ville: f.ville.trim(),
        salle: f.salle.trim() || null,
        pays: f.pays.trim().toUpperCase() || null,
        jour: f.jour,
        km_prochaine: f.km_prochaine ? parseInt(f.km_prochaine) : null,
        depart_hotel: f.depart_hotel.trim() || null,
        horaires: {
          load: f.load, soundcheck: f.soundcheck,
          doors: f.doors, set: f.set, curfew: f.curfew,
        },
      })
      .eq('id', d.id)
    setBusy(false)

    if (error) { setMsg('Erreur : ' + error.message); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button className="import-btn glass" onClick={() => setOpen(true)} style={{ marginBottom: 8 }}>
        ✏️ Modifier la date
      </button>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Modifier la date</h2>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <input className="login-input" placeholder="Ville *" value={f.ville} onChange={(e) => set('ville', e.target.value)} />
              <input className="login-input" placeholder="Salle" value={f.salle} onChange={(e) => set('salle', e.target.value)} />
              <input className="login-input" placeholder="Pays (ex: FR)" value={f.pays} onChange={(e) => set('pays', e.target.value)} />
              <div style={{ fontSize: 12, color: 'var(--ink-dim)', margin: '2px 4px 6px' }}>Date</div>
              <input className="login-input" type="date" value={f.jour} onChange={(e) => set('jour', e.target.value)} />

              <div style={{ fontSize: 13, color: 'var(--ink-dim)', margin: '14px 4px 8px', fontWeight: 600 }}>Horaires</div>
              <div className="add-times">
                <input className="login-input" placeholder="Load-in" value={f.load} onChange={(e) => set('load', e.target.value)} />
                <input className="login-input" placeholder="Soundcheck" value={f.soundcheck} onChange={(e) => set('soundcheck', e.target.value)} />
                <input className="login-input" placeholder="Doors" value={f.doors} onChange={(e) => set('doors', e.target.value)} />
                <input className="login-input" placeholder="Set" value={f.set} onChange={(e) => set('set', e.target.value)} />
                <input className="login-input" placeholder="Curfew" value={f.curfew} onChange={(e) => set('curfew', e.target.value)} />
              </div>

              <div style={{ fontSize: 13, color: 'var(--ink-dim)', margin: '14px 4px 8px', fontWeight: 600 }}>Transport commun</div>
              <div className="add-times">
                <input className="login-input" placeholder="Départ hôtel (ex: 09:30)" value={f.depart_hotel} onChange={(e) => set('depart_hotel', e.target.value)} />
                <input className="login-input" type="number" placeholder="Km prochaine date" value={f.km_prochaine} onChange={(e) => set('km_prochaine', e.target.value)} />
              </div>

              {msg && <p style={{ fontSize: 14, marginTop: 8, color: 'var(--red)' }}>{msg}</p>}
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn-primary" onClick={enregistrer} disabled={busy}>
                {busy ? '…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}