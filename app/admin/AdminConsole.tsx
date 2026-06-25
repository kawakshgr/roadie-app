'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Appartenance = { membre_id: string; groupe_id: string; groupe_nom: string; role: string }
type User = {
  id: string; email: string; pseudo: string | null; prenom: string | null
  nom: string | null; is_super_admin: boolean; cree_le: string; appartenances: Appartenance[]
}
type Groupe = { id: string; nom: string }

export default function AdminConsole({ groupes }: { groupes: Groupe[] }) {
  const [users, setUsers] = useState<User[]>([])
  const [recherche, setRecherche] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [creerOpen, setCreerOpen] = useState(false)
  const [nouveau, setNouveau] = useState({ email: '', prenom: '', nom: '', mdp: '' })
  const supabase = createClient()

  const appeler = useCallback(async (body: any) => {
    const { data, error } = await supabase.functions.invoke('admin', { body })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    return data
  }, [])

  const charger = useCallback(async () => {
    setBusy(true); setMsg('')
    try {
      const data = await appeler({ action: 'list' })
      setUsers(data.users)
    } catch (e: any) { setMsg('Erreur : ' + e.message) }
    setBusy(false)
  }, [appeler])

  useEffect(() => { charger() }, [charger])

  async function creer() {
    if (!nouveau.email.trim()) { setMsg('Email requis'); return }
    setBusy(true); setMsg('')
    try {
      const data = await appeler({
        action: 'create',
        email: nouveau.email.trim().toLowerCase(),
        prenom: nouveau.prenom, nom: nouveau.nom, mot_de_passe: nouveau.mdp || undefined,
      })
      setMsg(`✓ Créé : ${data.email} / ${data.mot_de_passe}`)
      setNouveau({ email: '', prenom: '', nom: '', mdp: '' })
      setCreerOpen(false)
      charger()
    } catch (e: any) { setMsg('Erreur : ' + e.message) }
    setBusy(false)
  }

  async function supprimer(u: User) {
    if (!confirm(`Supprimer définitivement ${u.email} ? Cette action est irréversible.`)) return
    setBusy(true); setMsg('')
    try {
      await appeler({ action: 'delete', user_id: u.id })
      setMsg('✓ Utilisateur supprimé')
      charger()
    } catch (e: any) { setMsg('Erreur : ' + e.message) }
    setBusy(false)
  }

  async function resetMdp(u: User) {
    if (!confirm(`Réinitialiser le mot de passe de ${u.email} ?`)) return
    setBusy(true); setMsg('')
    try {
      const data = await appeler({ action: 'reset_password', user_id: u.id })
      setMsg(`✓ Nouveau mot de passe pour ${u.email} : ${data.mot_de_passe}`)
    } catch (e: any) { setMsg('Erreur : ' + e.message) }
    setBusy(false)
  }

  async function ajouterGroupe(u: User, groupe_id: string, role: string) {
    if (!groupe_id) return
    setBusy(true); setMsg('')
    try {
      await appeler({ action: 'add_membre', user_id: u.id, groupe_id, role })
      charger()
    } catch (e: any) { setMsg('Erreur : ' + e.message) }
    setBusy(false)
  }

  async function changerRole(membre_id: string, role: string) {
    setBusy(true); setMsg('')
    try {
      await appeler({ action: 'update_role', membre_id, role })
      charger()
    } catch (e: any) { setMsg('Erreur : ' + e.message) }
    setBusy(false)
  }

  async function retirerGroupe(membre_id: string) {
    setBusy(true); setMsg('')
    try {
      await appeler({ action: 'remove_membre', membre_id })
      charger()
    } catch (e: any) { setMsg('Erreur : ' + e.message) }
    setBusy(false)
  }

  const filtres = users.filter((u) => {
    const q = recherche.toLowerCase()
    return !q ||
      u.email?.toLowerCase().includes(q) ||
      u.pseudo?.toLowerCase().includes(q) ||
      u.prenom?.toLowerCase().includes(q) ||
      u.nom?.toLowerCase().includes(q)
  })

  const nomAffiche = (u: User) => u.pseudo || u.prenom || u.nom || u.email

  return (
    <>
      <button className="import-btn glass" onClick={() => setCreerOpen(true)} style={{ marginBottom: 10 }}>
        + Créer un utilisateur
      </button>

      <input
        className="login-input"
        placeholder="🔍 Rechercher (email, pseudo, nom…)"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {msg && (
        <p style={{ fontSize: 14, marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: 'var(--glass)', color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>
          {msg}
        </p>
      )}

      <div className="sub" style={{ marginBottom: 10 }}>{filtres.length} utilisateur{filtres.length > 1 ? 's' : ''}</div>

      {filtres.map((u) => (
        <div key={u.id} className="form glass" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div className="membre-avatar">{nomAffiche(u).charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="gname">
                {nomAffiche(u)}
                {u.is_super_admin && <span className="pill ok" style={{ marginLeft: 8, fontSize: 11 }}>super-admin</span>}
              </div>
              <div className="gmeta">{u.email}</div>
            </div>
          </div>

          {/* appartenances */}
          {u.appartenances.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {u.appartenances.map((a) => (
                <div key={a.membre_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1, fontSize: 14 }}>{a.groupe_nom}</span>
                  <select
                    className="role-select"
                    value={a.role}
                    onChange={(e) => changerRole(a.membre_id, e.target.value)}
                    disabled={busy}
                  >
                    <option value="tm">TM</option>
                    <option value="technicien">Technicien</option>
                    <option value="artiste">Artiste</option>
                  </select>
                  <button className="membre-remove" onClick={() => retirerGroupe(a.membre_id)} disabled={busy}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* ajouter à un groupe */}
          <AjoutGroupe groupes={groupes} onAdd={(gid, role) => ajouterGroupe(u, gid, role)} disabled={busy} />

          {/* actions utilisateur */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn-ghost" onClick={() => resetMdp(u)} disabled={busy} style={{ flex: 1 }}>
              🔑 Reset mot de passe
            </button>
            {!u.is_super_admin && (
              <button className="btn-danger" onClick={() => supprimer(u)} disabled={busy} style={{ flex: 1 }}>
                🗑 Supprimer
              </button>
            )}
          </div>
        </div>
      ))}

      {/* modale création */}
      {creerOpen && (
        <div className="modal-bg" onClick={() => setCreerOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Créer un utilisateur</h2>
              <button className="modal-x" onClick={() => setCreerOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <input className="login-input" type="email" placeholder="Email *" value={nouveau.email} onChange={(e) => setNouveau({ ...nouveau, email: e.target.value })} />
              <div className="add-times">
                <input className="login-input" placeholder="Prénom" value={nouveau.prenom} onChange={(e) => setNouveau({ ...nouveau, prenom: e.target.value })} />
                <input className="login-input" placeholder="Nom" value={nouveau.nom} onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })} />
              </div>
              <input className="login-input" placeholder="Mot de passe (auto si vide)" value={nouveau.mdp} onChange={(e) => setNouveau({ ...nouveau, mdp: e.target.value })} />
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setCreerOpen(false)}>Annuler</button>
              <button className="btn-primary" onClick={creer} disabled={busy}>Créer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AjoutGroupe({ groupes, onAdd, disabled }: {
  groupes: Groupe[]; onAdd: (gid: string, role: string) => void; disabled: boolean
}) {
  const [gid, setGid] = useState('')
  const [role, setRole] = useState('artiste')
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <select className="role-select" value={gid} onChange={(e) => setGid(e.target.value)} style={{ flex: 1 }} disabled={disabled}>
        <option value="">+ Ajouter à un groupe…</option>
        {groupes.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
      </select>
      <select className="role-select" value={role} onChange={(e) => setRole(e.target.value)} disabled={disabled}>
        <option value="tm">TM</option>
        <option value="technicien">Technicien</option>
        <option value="artiste">Artiste</option>
      </select>
      <button className="btn-ghost" onClick={() => { onAdd(gid, role); setGid('') }} disabled={disabled || !gid}>OK</button>
    </div>
  )
}