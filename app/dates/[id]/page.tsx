import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../../ThemeToggle'
import InviteForm from './InviteForm'
import InviteList from './InviteList'

function fmtLong(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export default async function DayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: d, error } = await supabase
    .from('dates')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !d) notFound()

  const { data: membre } = await supabase
    .from('membres')
    .select('role')
    .eq('tournee_id', d.tournee_id)
    .eq('user_id', user.id)
    .single()
  const isTM = membre?.role === 'tm'

  const { data: invites } = await supabase
    .from('invitations')
    .select('*')
    .eq('date_id', d.id)
    .order('created_at', { ascending: true })

  const h = d.horaires ?? {}
  const lignes: [string, string][] = [
    ['Load-in', h.load], ['Soundcheck', h.soundcheck],
    ['Doors', h.doors], ['Set', h.set], ['Curfew', h.curfew],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <div className="wrap">
      <Link href="/dates" className="back-btn glass">
        <span className="back-chevron">‹</span>
        <span>Itinéraire</span>
      </Link>

      <div className="page-head">
        <div>
          <div className="eyebrow">Jour {d.numero} · {fmtLong(d.jour)}</div>
          <h1>{d.ville}</h1>
          <div className="sub">{d.salle}</div>
        </div>
        <ThemeToggle />
      </div>

      <div className="label">Horaires du jour</div>
      <div className="sched glass">
        {lignes.map(([nom, heure]) => (
          <div className="row" key={nom}>
            <span className="t">{heure}</span>
            <span className="ev">{nom}</span>
          </div>
        ))}
      </div>

      {d.hebergement?.hotel && (
        <>
          <div className="label">Logistique</div>
          <div className="card glass">
            <div className="ic">🛏</div>
            <div style={{ flex: 1 }}>
              <div className="h">{d.hebergement.hotel}</div>
              <div className="d">{d.hebergement.adresse ?? ''}</div>
            </div>
          </div>
        </>
      )}

      <div className="label">Invitations</div>
      <InviteList dateId={d.id} initial={invites ?? []} isTM={isTM} />
      <InviteForm dateId={d.id} />
    </div>
  )
}