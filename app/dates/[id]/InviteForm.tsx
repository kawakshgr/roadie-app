'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InviteForm({ dateId }: { dateId: string }) {
  const [nom, setNom] = useState('')
  const [type, setType] = useState('Simple')
  const [typeAutre, setTypeAutre] = useState('')
  const [acces, setAcces] = useState('Standard')
  const [accesAutre, setAccesAutre] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const supabase = createClient()

  async function envoyer() {
    if (!nom.trim()) { setMsg('Entre un nom'); return }

    // valeur finale : l'option choisie, ou le texte libre si "Autre"
    const typeFinal = type === 'Autre' ? typeAutre.trim() : type
    const accesFinal = acces === 'Autre' ? accesAutre.trim() : acces

    if (type === 'Autre' && !typeFinal) { setMsg('Précise le type de place'); return }
    if (acces === 'Autre' && !accesFinal) { setMsg('Précise l\'accès'); return }

    setBusy(true); setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsg('Non connecté'); setBusy(false); return }

    const { error } = await supabase.from('invitations').insert({
      date_id: dateId,
      demande_par: user.id,
      nom_invite: nom.trim(),
      type_place: typeFinal,
      acces: accesFinal,
      statut: 'en_attente',
    })
    setBusy(false)

    if (error) { setMsg(error.message); return }
    setNom(''); setType('Simple'); setTypeAutre(''); setAcces('Standard'); setAccesAutre('')
    setMsg('Demande envoyée ✓')
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
          <option value="Simple">Place simple</option>
          <option value="+1">+1</option>
          <option value="+2">+2</option>
          <option value="+3">+3</option>
          <option value="Autre">Autre…</option>
        </select>
        <select value={acces} onChange={(e) => setAcces(e.target.value)}>
          <option value="Standard">Standard</option>
          <option value="Backstage">Backstage</option>
          <option value="VIP">VIP</option>
          <option value="Press">Press</option>
          <option value="Autre">Autre…</option>
        </select>
      </div>

      {(type === 'Autre' || acces === 'Autre') && (
        <div className="duo">
          {type === 'Autre' ? (
            <input
              placeholder="Type de place (ex : +5)"
              value={typeAutre}
              onChange={(e) => setTypeAutre(e.target.value)}
            />
          ) : <div style={{ flex: 1 }} />}
          {acces === 'Autre' ? (
            <input
              placeholder="Accès (ex : Photo pit)"
              value={accesAutre}
              onChange={(e) => setAccesAutre(e.target.value)}
            />
          ) : <div style={{ flex: 1 }} />}
        </div>
      )}

      <button className="send-btn" onClick={envoyer} disabled={busy}>
        {busy ? 'Envoi…' : 'Envoyer pour validation'}
      </button>
      {msg && <p style={{ marginTop: 8, fontSize: 13, color: msg.includes('✓') ? 'var(--green)' : 'var(--ink-dim)' }}>{msg}</p>}
    </div>
  )
}