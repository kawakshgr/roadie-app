'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditGroupe({ id, nomActuel }: { id: string; nomActuel: string }) {
  const [open, setOpen] = useState(false)
  const [nom, setNom] = useState(nomActuel)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function enregistrer() {
    if (!nom.trim()) { setMsg('Entre un nom'); return }
    setBusy(true); setMsg('')

    const { error } = await supabase
      .from('groupes')
      .update({ nom: nom.trim() })
      .eq('id', id)
    setBusy(false)

    if (error) { setMsg('Erreur : ' + error.message); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        className="edit-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        aria-label="Renommer le groupe"
      >
        ✎
      </button>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Renommer le groupe</h2>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                className="login-input"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enregistrer()}
                autoFocus
              />
              {msg && <p style={{ fontSize: 14, marginTop: 8 }}>{msg}</p>}
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