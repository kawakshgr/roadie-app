'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type PJ = {
  id: string
  nom_fichier: string
  chemin: string
  taille: number | null
  type_mime: string | null
}

export default function PiecesJointes({
  dateId, tourneeId, peutEditer,
}: {
  dateId?: string; tourneeId?: string; peutEditer: boolean
}) {
  const [liste, setListe] = useState<PJ[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const supabase = createClient()

  const charger = useCallback(async () => {
    let q = supabase.from('pieces_jointes').select('*').order('created_at', { ascending: true })
    q = dateId ? q.eq('date_id', dateId) : q.eq('tournee_id', tourneeId!)
    const { data } = await q
    setListe(data ?? [])
  }, [dateId, tourneeId])

  useEffect(() => { charger() }, [charger])

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setMsg('Envoi…')

    // chemin unique dans le bucket
    const ext = file.name.split('.').pop()
    const chemin = `${dateId ?? tourneeId}/${crypto.randomUUID()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('pieces-jointes')
      .upload(chemin, file)

    if (upErr) { setMsg('Erreur upload : ' + upErr.message); setBusy(false); return }

    const { error: dbErr } = await supabase.from('pieces_jointes').insert({
      date_id: dateId ?? null,
      tournee_id: tourneeId ?? null,
      nom_fichier: file.name,
      chemin,
      taille: file.size,
      type_mime: file.type,
    })
    setBusy(false)

    if (dbErr) { setMsg('Erreur : ' + dbErr.message); return }
    setMsg('')
    e.target.value = ''
    charger()
  }

  async function telecharger(pj: PJ) {
    const { data, error } = await supabase.storage
      .from('pieces-jointes')
      .createSignedUrl(pj.chemin, 60) // lien valable 60 secondes
    if (error || !data) { alert('Erreur de téléchargement'); return }
    window.open(data.signedUrl, '_blank')
  }

  async function supprimer(pj: PJ) {
    if (!confirm(`Supprimer ${pj.nom_fichier} ?`)) return
    await supabase.storage.from('pieces-jointes').remove([pj.chemin])
    await supabase.from('pieces_jointes').delete().eq('id', pj.id)
    charger()
  }

  function fmtTaille(o: number | null) {
    if (!o) return ''
    if (o < 1024) return `${o} o`
    if (o < 1024 * 1024) return `${Math.round(o / 1024)} Ko`
    return `${(o / 1024 / 1024).toFixed(1)} Mo`
  }

  return (
    <>
      {liste.map((pj) => (
        <div key={pj.id} className="card glass">
          <div className="ic">📎</div>
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => telecharger(pj)}>
            <div className="h" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pj.nom_fichier}</div>
            <div className="d">{fmtTaille(pj.taille)} · toucher pour télécharger</div>
          </div>
          {peutEditer && (
            <button className="membre-remove" onClick={() => supprimer(pj)} aria-label="Supprimer">×</button>
          )}
        </div>
      ))}

      {liste.length === 0 && (
        <p style={{ color: 'var(--ink-dim)', fontSize: 14, padding: '4px 8px' }}>
          Aucune pièce jointe.
        </p>
      )}

      {peutEditer && (
        <label className="import-btn glass" style={{ marginTop: 8, cursor: 'pointer', display: 'inline-flex' }}>
          📎 Ajouter une pièce jointe
          <input type="file" onChange={onUpload} disabled={busy} style={{ display: 'none' }} />
        </label>
      )}
      {msg && <p style={{ fontSize: 14, marginTop: 8, color: 'var(--ink-dim)' }}>{msg}</p>}
    </>
  )
}