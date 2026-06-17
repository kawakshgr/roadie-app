'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CreateTournee({ groupeId }: { groupeId: string }) {
  const [open, setOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function creer() {
    if (!nom.trim()) { setMsg('Entre un nom'); return }
    setBusy(true); setMsg('Création…')

    const { error } = await supabase.from('tournees').insert({
      groupe_id: groupeId,
      nom: nom.trim(),
      debut: debut || null,
      fin: fin || null,
    })
    setBusy(false)
    if (error) { setMsg('Erreur : ' + error.message); return }

    setNom(''); setDebut(''); setFin(''); setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button className="import-btn glass" onClick={() => setOpen(true)} style={{ marginBottom: 14 }}>
        + Nouvelle tournée
      </button>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Nouvelle tournée</h2>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                className="login-input"
                placeholder="Nom de la tournée"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
              <div className="add-times">
                <input className="login-input" type="date" value={debut} onChange={(e) => setDebut(e.target.value)} />
                <input className="login-input" type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
              </div>
              {msg && <p style={{ fontSize: 14, marginTop: 8 }}>{msg}</p>}
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn-primary" onClick={creer} disabled={busy}>
                {busy ? '…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}