'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Contact = {
  id: string
  fonction: string
  nom: string | null
  prenom: string | null
  telephone: string | null
  email: string | null
}

const FONCTIONS = [
  'Orga', 'Régie salle', 'Régie lumière', 'Régie son',
  'Sécurité', 'Bus driver', 'Catering', 'Production', 'Communication', 'Autre',
]

export default function Contacts({
  dateId, tourneeId, peutEditer,
}: {
  dateId?: string; tourneeId?: string; peutEditer: boolean
}) {
  const [liste, setListe] = useState<Contact[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [f, setF] = useState({
    fonction: 'Orga', fonctionAutre: '',
    nom: '', prenom: '', telephone: '', email: '',
  })
  const supabase = createClient()

  const charger = useCallback(async () => {
    let q = supabase.from('contacts').select('*').order('created_at', { ascending: true })
    q = dateId ? q.eq('date_id', dateId) : q.eq('tournee_id', tourneeId!)
    const { data } = await q
    setListe(data ?? [])
  }, [dateId, tourneeId])

  useEffect(() => { charger() }, [charger])

  function set(k: string, v: string) {
    setF((cur) => ({ ...cur, [k]: v }))
  }

  async function ajouter() {
    const fonction = f.fonction === 'Autre' ? f.fonctionAutre.trim() : f.fonction
    if (!fonction) { setMsg('Précise la fonction'); return }
    if (!f.nom.trim() && !f.prenom.trim()) { setMsg('Indique au moins un nom'); return }
    setBusy(true); setMsg('')

    const { error } = await supabase.from('contacts').insert({
      date_id: dateId ?? null,
      tournee_id: tourneeId ?? null,
      fonction,
      nom: f.nom.trim() || null,
      prenom: f.prenom.trim() || null,
      telephone: f.telephone.trim() || null,
      email: f.email.trim() || null,
    })
    setBusy(false)
    if (error) { setMsg('Erreur : ' + error.message); return }

    setF({ fonction: 'Orga', fonctionAutre: '', nom: '', prenom: '', telephone: '', email: '' })
    setOpen(false)
    charger()
  }

  async function supprimer(c: Contact) {
    if (!confirm(`Supprimer ${c.fonction} ${c.prenom ?? ''} ${c.nom ?? ''} ?`)) return
    await supabase.from('contacts').delete().eq('id', c.id)
    charger()
  }

  const nomComplet = (c: Contact) => [c.prenom, c.nom].filter(Boolean).join(' ') || '—'

  return (
    <>
      {liste.map((c) => (
        <div key={c.id} className="card glass">
          <div className="ic">📇</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h">{c.fonction} · {nomComplet(c)}</div>
            <div className="d">
              {[
                c.telephone ? `📞 ${c.telephone}` : null,
                c.email ? `✉ ${c.email}` : null,
              ].filter(Boolean).join('  ·  ')}
            </div>
          </div>
          {peutEditer && (
            <button className="membre-remove" onClick={() => supprimer(c)} aria-label="Supprimer">×</button>
          )}
        </div>
      ))}

      {liste.length === 0 && (
        <p style={{ color: 'var(--ink-dim)', fontSize: 14, padding: '4px 8px' }}>
          Aucun contact.
        </p>
      )}

      {peutEditer && (
        <button className="import-btn glass" onClick={() => setOpen(true)} style={{ marginTop: 8 }}>
          + Ajouter un contact
        </button>
      )}

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Ajouter un contact</h2>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <select className="login-input" value={f.fonction} onChange={(e) => set('fonction', e.target.value)}>
                {FONCTIONS.map((fn) => (
                  <option key={fn} value={fn}>{fn === 'Autre' ? 'Autre…' : fn}</option>
                ))}
              </select>
              {f.fonction === 'Autre' && (
                <input className="login-input" placeholder="Précise la fonction" value={f.fonctionAutre} onChange={(e) => set('fonctionAutre', e.target.value)} />
              )}
              <div className="add-times">
                <input className="login-input" placeholder="Prénom" value={f.prenom} onChange={(e) => set('prenom', e.target.value)} />
                <input className="login-input" placeholder="Nom" value={f.nom} onChange={(e) => set('nom', e.target.value)} />
              </div>
              <input className="login-input" type="tel" placeholder="Téléphone" value={f.telephone} onChange={(e) => set('telephone', e.target.value)} />
              <input className="login-input" type="email" placeholder="Email" value={f.email} onChange={(e) => set('email', e.target.value)} />
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