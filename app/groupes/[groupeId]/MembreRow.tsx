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
  membre, isTM, estMoi, groupeId,
}: {
  membre: Membre; isTM: boolean; estMoi: boolean; groupeId: string
}) {
  const [role, setRole] = useState(membre.role)
  const [busy, setBusy] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const p = membre.profils
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

  async function resetMotDePasse() {
    if (!confirm(`Réinitialiser le mot de passe de ${affichage} ?`)) return
    setBusy(true); setResetMsg('')
    const { data, error } = await supabase.functions.invoke('inviter-membre', {
      body: { action: 'reset_membre', user_id: membre.user_id, groupe_id: groupeId },
    })
    setBusy(false)
    if (error) { setResetMsg('Erreur : ' + error.message); return }
    if (data?.error) { setResetMsg('Erreur : ' + data.error); return }
    setResetMsg(`Nouveau mot de passe : ${data.mot_de_passe}`)
  }

  return (
    <div className="guest glass" style={{ flexWrap: 'wrap' }}>
      <div className="membre-avatar">{affichage.charAt(0).toUpperCase()}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="gname">{affichage}{estMoi && ' (toi)'}</div>
        <div className="gmeta">{email}</div>
      </div>

      {isTM && !estMoi ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {role !== 'tm' && (
            <button className="membre-remove" onClick={resetMotDePasse} disabled={busy} title="Réinitialiser le mot de passe" style={{ color: 'var(--accent)' }}>🔑</button>
          )}
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

      {resetMsg && (
        <div style={{ flexBasis: '100%', marginTop: 8, fontSize: 13, color: resetMsg.startsWith('Erreur') ? 'var(--red)' : 'var(--green)' }}>
          {resetMsg}
        </div>
      )}
    </div>
  )
}