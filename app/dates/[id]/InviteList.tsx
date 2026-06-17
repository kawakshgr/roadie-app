'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Invite = {
  id: string; nom_invite: string; type_place: string
  acces: string; statut: 'en_attente' | 'validee' | 'refusee'
}

const PILL: Record<string, { txt: string; cls: string }> = {
  en_attente: { txt: 'En attente', cls: 'wait' },
  validee: { txt: 'Validée', cls: 'ok' },
  refusee: { txt: 'Refusée', cls: 'no' },
}

export default function InviteList({
  dateId, initial, isTM,
}: {
  dateId: string; initial: Invite[]; isTM: boolean
}) {
  const [invites, setInvites] = useState<Invite[]>(initial)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`invites-${dateId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'invitations', filter: `date_id=eq.${dateId}` },
        (payload) => {
          setInvites((cur) => {
            if (payload.eventType === 'INSERT') return [...cur, payload.new as Invite]
            if (payload.eventType === 'UPDATE')
              return cur.map((i) => (i.id === payload.new.id ? (payload.new as Invite) : i))
            if (payload.eventType === 'DELETE')
              return cur.filter((i) => i.id !== payload.old.id)
            return cur
          })
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [dateId])

  async function decider(id: string, statut: 'validee' | 'refusee') {
    const { error } = await supabase.from('invitations').update({ statut }).eq('id', id)
    if (error) alert(error.message)
    // pas besoin de setInvites : le realtime renvoie l'UPDATE
  }

  if (!invites.length) return <p style={{ color: 'var(--ink-dim)', fontSize: 14, margin: '8px' }}>Aucune invitation.</p>

  return (
    <div>
      {invites.map((i) => (
        <div key={i.id}>
          <div className="guest glass">
            <span className="status-dot" style={{
              background: i.statut === 'validee' ? 'var(--green)'
                : i.statut === 'refusee' ? 'var(--red)' : 'var(--amber)',
            }} />
            <div style={{ flex: 1 }}>
              <div className="gname">{i.nom_invite}</div>
              <div className="gmeta">{i.type_place} · {i.acces}</div>
            </div>
            <span className={`pill ${PILL[i.statut].cls}`}>{PILL[i.statut].txt}</span>
          </div>
          {isTM && i.statut === 'en_attente' && (
            <div className="approve-actions">
              <button className="btn-ok" onClick={() => decider(i.id, 'validee')}>✓ Valider</button>
              <button className="btn-no" onClick={() => decider(i.id, 'refusee')}>✕ Refuser</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}