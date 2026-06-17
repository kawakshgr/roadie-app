'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmDelete({
  table, id, nom, libelle, redirectTo,
}: {
  table: 'groupes' | 'tournees' | 'dates'
  id: string
  nom: string
  libelle: string          // ex: "ce groupe", "cette tournée"
  redirectTo?: string      // où aller après suppression
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function supprimer() {
    setBusy(true); setMsg('')
    const { error } = await supabase.from(table).delete().eq('id', id)
    setBusy(false)
    if (error) { setMsg('Erreur : ' + error.message); return }
    setOpen(false)
    if (redirectTo) { router.push(redirectTo); router.refresh() }
    else router.refresh()
  }

  return (
    <>
      <button
        className="delete-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        aria-label="Supprimer"
      >
        🗑
      </button>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Supprimer {libelle} ?</h2>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 15, lineHeight: 1.5 }}>
                <b>{nom}</b> sera définitivement supprimé{libelle.startsWith('cette') ? 'e' : ''},
                ainsi que tout son contenu. Cette action est irréversible.
              </p>
              {msg && <p style={{ fontSize: 14, marginTop: 12, color: 'var(--red)' }}>{msg}</p>}
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn-danger" onClick={supprimer} disabled={busy}>
                {busy ? '…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}