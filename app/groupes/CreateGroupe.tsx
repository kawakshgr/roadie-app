'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CreateGroupe({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const supabase = createClient()
  const router = useRouter()

  if (!isSuperAdmin) return null

  async function creer() {
    if (!nom.trim()) { setMsg('Entre un nom'); return }
    setBusy(true); setMsg('Création…')

    const { error } = await supabase.rpc('creer_groupe', { nom_groupe: nom.trim() })
    setBusy(false)

    if (error) { setMsg('Erreur : ' + error.message); return }
    setNom(''); setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button className="import-btn glass" onClick={() => setOpen(true)} style={{ marginBottom: 14 }}>
        + Nouveau groupe
      </button>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Nouveau groupe</h2>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                className="login-input"
                placeholder="Nom du groupe"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && creer()}
              />
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