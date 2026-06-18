'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profil = {
  id: string
  nom?: string | null
  prenom?: string | null
  pseudo?: string | null
  adresse?: string | null
  telephone?: string | null
}

export default function CompteForm({ profil, email }: { profil: Profil; email: string }) {
  const [f, setF] = useState({
    nom: profil.nom ?? '',
    prenom: profil.prenom ?? '',
    pseudo: profil.pseudo ?? '',
    adresse: profil.adresse ?? '',
    telephone: profil.telephone ?? '',
  })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  function set(k: string, v: string) {
    setF((cur) => ({ ...cur, [k]: v }))
  }

  async function enregistrer() {
    setBusy(true); setMsg('')
    const { error } = await supabase
      .from('profils')
      .update({
        nom: f.nom.trim() || null,
        prenom: f.prenom.trim() || null,
        pseudo: f.pseudo.trim() || null,
        adresse: f.adresse.trim() || null,
        telephone: f.telephone.trim() || null,
      })
      .eq('id', profil.id)
    setBusy(false)

    if (error) {
      if (error.message.includes('pseudo_unique') || error.code === '23505') {
        setMsg('Ce pseudo est déjà utilisé, choisis-en un autre.')
      } else {
        setMsg('Erreur : ' + error.message)
      }
      return
    }
    setMsg('✓ Profil enregistré')
    router.refresh()
  }

  async function changerMdp() {
    if (pwd.length < 6) { setPwdMsg('6 caractères minimum'); return }
    if (pwd !== pwd2) { setPwdMsg('Les mots de passe ne correspondent pas'); return }
    setPwdBusy(true); setPwdMsg('')

    const { error } = await supabase.auth.updateUser({ password: pwd })
    setPwdBusy(false)

    if (error) { setPwdMsg('Erreur : ' + error.message); return }
    setPwd(''); setPwd2(''); setPwdMsg('✓ Mot de passe modifié')
  }

  return (
    <>
      <div className="label">Informations</div>
      <div className="form glass">
        <input
          className="login-input"
          value={email}
          disabled
          style={{ opacity: 0.6, cursor: 'not-allowed' }}
        />
        <input className="login-input" placeholder="Prénom" value={f.prenom} onChange={(e) => set('prenom', e.target.value)} />
        <input className="login-input" placeholder="Nom" value={f.nom} onChange={(e) => set('nom', e.target.value)} />
        <input className="login-input" placeholder="Pseudo" value={f.pseudo} onChange={(e) => set('pseudo', e.target.value)} />
        <input className="login-input" placeholder="Téléphone" value={f.telephone} onChange={(e) => set('telephone', e.target.value)} />
        <input className="login-input" placeholder="Adresse" value={f.adresse} onChange={(e) => set('adresse', e.target.value)} />
        <button className="send-btn" onClick={enregistrer} disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {msg && <p style={{ marginTop: 10, fontSize: 14, color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{msg}</p>}
      </div>

      <div className="label">Mot de passe</div>
      <div className="form glass">
        <input className="login-input" type="password" placeholder="Nouveau mot de passe" value={pwd} onChange={(e) => setPwd(e.target.value)} />
        <input className="login-input" type="password" placeholder="Confirmer" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
        <button className="send-btn" onClick={changerMdp} disabled={pwdBusy}>
          {pwdBusy ? 'Modification…' : 'Changer le mot de passe'}
        </button>
        {pwdMsg && <p style={{ marginTop: 10, fontSize: 14, color: pwdMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{pwdMsg}</p>}
      </div>
    </>
  )
}