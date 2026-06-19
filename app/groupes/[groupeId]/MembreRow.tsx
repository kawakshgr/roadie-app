'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Membre = {
  id: string
  role: string
  user_id: string
  profils: {
    pseudo: string | null
    prenom: string | null
    nom: string | null
    email: string | null
  } | null
}

export default function MembreRow({
  membre, isTM, estMoi,
}: {
  membre: Membre; isTM: boolean; estMoi: boolean
}) {
  const [role, setRole] = useState(membre.role)
  const [busy, setBusy] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const p = membre.profils
  // priorité : pseudo > prénom > nom > email
  const affichage = p?.pseudo || p?.prenom || p?.nom || p?.email || 'Membre'
  const email = p?.email || ''

  async function changerRole(nouveau: string) {
    setBusy(true)
    setRole(nouveau)
    const { error } = await supabase
      .from('membres')
      .update({ role: nouveau })
      .eq('id', membre.id)
    setBusy(false)
    if (error) { alert(error.message); setRole(membre.role) }
    else router.refresh()
  }

  async function retirer() {
    if (!confirm(`Retirer ${affichage} du groupe ?`)) return
    setBusy(true)
    const { error } = await supabase.from('membres').delete().eq('id', membre.id)
    setBusy(false)
    if (error) alert(error.message)
    else router.refresh()
  }

  return (
    <div className="guest glass">
      <div className="membre-avatar">{affichage.charAt(0).toUpperCase()}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="gname">{affichage}{estMoi && ' (toi)'}</div>
        <div className="gmeta">{email}</div>
      </div>

      {isTM && !estMoi ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="role-select"
            value={role}
            onChange={(e) => changerRole(e.target.value)}
            disabled={busy}
          >
            <option value="tm">Tour Manager</option>
            <option value="artiste">Artiste</option>
            <option value="technicien">Technicien</option>
          </select>
          <button className="membre-remove" onClick={retirer} disabled={busy} aria-label="Retirer">×</button>
        </div>
      ) : (
        <span className="pill ok" style={{ background: 'var(--glass)', color: 'var(--ink-dim)' }}>
          {role === 'tm' ? 'Tour Manager' : role === 'artiste' ? 'Artiste' : 'Technicien'}
        </span>
      )}
    </div>
  )
}