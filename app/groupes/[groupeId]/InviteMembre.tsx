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

  async function ajouter() {
    if (!email.trim()) { setMsg('Entre un email'); return }
    setBusy(true); setMsg('Traitement…')

    const { data, error } = await supabase.functions.invoke('inviter-membre', {
      body: {
        email: email.trim().toLowerCase(),
        groupe_id: groupeId,
        role,
        mot_de_passe: mdp || undefined,
        nom: nom.trim() || undefined,
        prenom: prenom.trim() || undefined,
      },
    })
    setBusy(false)

    if (error) { setMsg('Erreur : ' + error.message); return }
    if (data?.error) { setMsg('Erreur : ' + data.error); return }

    if (data?.estNouveau) {
      setMsg(`✓ Compte créé. Identifiants : ${data.email} / ${data.mot_de_passe}`)
    } else {
      setMsg('✓ Membre existant rattaché au groupe')
    }
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

              <p style={{ fontSize: 13, color: 'var(--ink-dim)', margin: '6px 4px 10px', lineHeight: 1.5 }}>
                Si la personne a déjà un compte, elle sera simplement rattachée. Sinon, remplis les infos ci-dessous pour créer son compte.
              </p>

              <div className="add-times">
                <input className="login-input" placeholder="Prénom (nouveau compte)" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                <input className="login-input" placeholder="Nom (nouveau compte)" value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="login-input"
                  placeholder="Mot de passe (auto si vide)"
                  value={mdp}
                  onChange={(e) => setMdp(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn-ghost" onClick={genererMdp} type="button" style={{ flexShrink: 0 }}>
                  Générer
                </button>
              </div>

              {msg && <p style={{ fontSize: 14, marginTop: 10, color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{msg}</p>}
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setOpen(false)}>Fermer</button>
              <button className="btn-primary" onClick={ajouter} disabled={busy}>
                {busy ? 'Traitement…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}