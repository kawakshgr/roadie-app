'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Membre = { user_id: string; nom: string }

export default function TransportForm({
  dateId, membres,
}: {
  dateId: string; membres: Membre[]
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [f, setF] = useState({
    user_id: '',
    type: 'train',
    compagnie: '',
    numero_reservation: '',
    depart_lieu: '',
    depart_heure: '',
    arrivee_lieu: '',
    arrivee_heure: '',
  })
  const supabase = createClient()
  const router = useRouter()

  function set(k: string, v: string) {
    setF((cur) => ({ ...cur, [k]: v }))
  }

  async function ajouter() {
    if (!f.user_id) { setMsg('Choisis un membre'); return }
    setBusy(true); setMsg('')

    const base = {
      date_id: dateId,
      type: f.type,
      compagnie: f.compagnie.trim() || null,
      numero_reservation: f.numero_reservation.trim() || null,
      depart_lieu: f.depart_lieu.trim() || null,
      depart_heure: f.depart_heure.trim() || null,
      arrivee_lieu: f.arrivee_lieu.trim() || null,
      arrivee_heure: f.arrivee_heure.trim() || null,
    }

    // "Tout le monde" → une ligne par membre ; sinon une seule
    const cibles = f.user_id === '__tous__'
      ? membres.map((m) => m.user_id)
      : [f.user_id]

    const payload = cibles.map((uid) => ({ ...base, user_id: uid }))

    const { error } = await supabase.from('transports').upsert(payload, {
      onConflict: 'date_id,user_id,type',
    })
    setBusy(false)

    if (error) { setMsg('Erreur : ' + error.message); return }

    setF({ user_id: '', type: 'train', compagnie: '', numero_reservation: '', depart_lieu: '', depart_heure: '', arrivee_lieu: '', arrivee_heure: '' })
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button className="import-btn glass" onClick={() => setOpen(true)} style={{ marginTop: 8 }}>
        + Ajouter un transport
      </button>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Ajouter un transport</h2>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <select className="login-input" value={f.user_id} onChange={(e) => set('user_id', e.target.value)}>
                <option value="">— Choisir —</option>
                <option value="__tous__">👥 Tout le monde</option>
                {membres.map((m) => (
                  <option key={m.user_id} value={m.user_id}>{m.nom}</option>
                ))}
              </select>
              <select className="login-input" value={f.type} onChange={(e) => set('type', e.target.value)}>
                <option value="train">Train</option>
                <option value="avion">Avion</option>
                <option value="van">Van</option>
                <option value="autre">Autre</option>
              </select>
              <input className="login-input" placeholder="Compagnie (SNCF, Air France…)" value={f.compagnie} onChange={(e) => set('compagnie', e.target.value)} />
              <input className="login-input" placeholder="N° de réservation" value={f.numero_reservation} onChange={(e) => set('numero_reservation', e.target.value)} />
              <div className="add-times">
                <input className="login-input" placeholder="Lieu départ" value={f.depart_lieu} onChange={(e) => set('depart_lieu', e.target.value)} />
                <input className="login-input" placeholder="Heure départ" value={f.depart_heure} onChange={(e) => set('depart_heure', e.target.value)} />
                <input className="login-input" placeholder="Lieu arrivée" value={f.arrivee_lieu} onChange={(e) => set('arrivee_lieu', e.target.value)} />
                <input className="login-input" placeholder="Heure arrivée" value={f.arrivee_heure} onChange={(e) => set('arrivee_heure', e.target.value)} />
              </div>
              {f.user_id === '__tous__' && (
                <p style={{ fontSize: 13, color: 'var(--ink-dim)', marginTop: 4 }}>
                  Ce transport sera attribué à tous les membres du groupe.
                </p>
              )}
              {msg && <p style={{ fontSize: 14, marginTop: 8, color: 'var(--red)' }}>{msg}</p>}
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