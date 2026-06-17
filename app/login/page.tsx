'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function signIn() {
    setBusy(true)
    setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd })
    setBusy(false)
    if (error) { setMsg(error.message); return }
    router.push('/dates')
    router.refresh()
  }

  return (
    <div className="login-wrap">
      <div className="login-card glass">
        <div className="login-brand">road<span>ie</span></div>
        <h1 className="login-title">Connexion</h1>
        <p className="login-sub">Accède à ta tournée</p>

        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && signIn()}
        />
        <input
          className="login-input"
          type="password"
          placeholder="Mot de passe"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && signIn()}
        />

        <button className="login-btn" onClick={signIn} disabled={busy}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>

        {msg && <p className="login-error">{msg}</p>}
      </div>
    </div>
  )
}