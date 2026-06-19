'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InviteMembre({ groupeId }: { groupeId: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [role, setRole] = useState('artiste')
  const [mdp, setMdp] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const supabase = createClient()
  const router = useRouter()

  function genererMdp() {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let p = ''
    for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)]
    setMdp(p)
  }

  async function creer() {
    if (!email.trim()) { setMsg('Entre un email'); return }
    if (!prenom.trim() || !nom.trim()) { setMsg('Prénom et nom obligatoires'); return }
    if (mdp.length < 6) { setMsg('Mot de passe : 6 caractères minimum'); return }
    setBusy(true); setMsg('Création du compte…')

    const { data, error } = await supabase.functions.invoke('inviter-membre', {
      body: {
        email: email.trim().toLowerCase(),
        groupe_id: groupeId,
        role,
        mot_de_passe: mdp,
        nom: nom.trim(),
        prenom: prenom.trim(),
      },
    })
    setBusy(false)

    if (error) { setMsg('Erreur : ' + error.message); return }
    if (data?.error) { setMsg('Erreur : ' + data.error); return }

    setMsg(`✓ Compte créé. Identifiants : ${email} / ${mdp}`)
    setEmail(''); setPrenom(''); setNom(''); setMdp('')
    router.refresh()
  }

  return (
    <>
      <button className="import-btn glass" onClick={() => setOpen(true)} style={{ marginBottom: 8 }}>
        📧 Ajouter un membre
      </button>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Ajouter un membre</h2>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="add-times">
                <input className="login-input" placeholder="Prénom *" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                <input className="login-input" placeholder="Nom *" value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
              <input
                className="login-input"
                type="email"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select className="login-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="artiste">Artiste</option>
                <option value="technicien">Technicien</option>
                <option value="tm">Tour Manager</option>
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="login-input"
                  placeholder="Mot de passe provisoire *"
                  value={mdp}
                  onChange={(e) => setMdp(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn-ghost" onClick={genererMdp} type="button" style={{ flexShrink: 0 }}>
                  Générer
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-dim)', marginTop: 4, lineHeight: 1.5 }}>
                Le compte est créé immédiatement. La personne pourra compléter son profil (passeport, adresse…) et changer son mot de passe elle-même.
              </p>
              {msg && <p style={{ fontSize: 14, marginTop: 10, color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{msg}</p>}
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setOpen(false)}>Fermer</button>
              <button className="btn-primary" onClick={creer} disabled={busy}>
                {busy ? 'Création…' : 'Créer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}