'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InviteForm({ dateId }: { dateId: string }) {
  const [nom, setNom] = useState('')
  const [type, setType] = useState('simple')
  const [acces, setAcces] = useState('standard')
  const [msg, setMsg] = useState('')
  const supabase = createClient()

  async function envoyer() {
    if (!nom.trim()) { setMsg('Entre un nom'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsg('Non connecté'); return }

    const { error } = await supabase.from('invitations').insert({
      date_id: dateId,
      demande_par: user.id,
      nom_invite: nom.trim(),
      type_place: type,
      acces,
      statut: 'en_attente',
    })

    if (error) { setMsg(error.message); return }
    setNom(''); setMsg('Demande envoyée ✓')
  }

  return (
    <div className="form glass">
      <div className="ftitle">Nouvelle invitation</div>
      <input
        placeholder="Nom de l'invité"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
      />
      <div className="duo">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="simple">Place simple</option>
          <option value="+1">+1</option>
        </select>
        <select value={acces} onChange={(e) => setAcces(e.target.value)}>
          <option value="standard">Standard</option>
          <option value="backstage">Backstage</option>
        </select>
      </div>
      <button className="send-btn" onClick={envoyer}>Envoyer pour validation</button>
      {msg && <p style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-dim)' }}>{msg}</p>}
    </div>
  )
}