import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../../ThemeToggle'
import InviteForm from './InviteForm'
import InviteList from './InviteList'
import TransportForm from './TransportForm'
import TransportItem from './TransportItem'
import EditDate from './EditDate'
import PiecesJointes from '../PiecesJointes'

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

  // Vague 1 : la date (nécessaire pour connaître la tournée)
  const { data: d, error } = await supabase
    .from('dates')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !d) notFound()

  // Vague 2 : la tournée (pour le groupe) — et en parallèle, ce qui ne dépend que de la date
  const [
    { data: tournee },
    { data: invites },
    { data: transports },
  ] = await Promise.all([
    supabase.from('tournees').select('groupe_id').eq('id', d.tournee_id).single(),
    supabase.from('invitations').select('*').eq('date_id', d.id).order('created_at', { ascending: true }),
    supabase.from('transports').select('*').eq('date_id', d.id),
  ])

  // Vague 3 : tout ce qui dépend du groupe → en parallèle
  let isTM = false
  let isTechnicien = false
  let isSuperAdmin = false
  let membresListe: { user_id: string; nom: string }[] = []

  if (tournee) {
    const [
      { data: membre },
      { data: profilMoi },
      { data: ms },
    ] = await Promise.all([
      supabase.from('membres').select('role').eq('groupe_id', tournee.groupe_id).eq('user_id', user.id).maybeSingle(),
      supabase.from('profils').select('is_super_admin').eq('id', user.id).maybeSingle(),
      supabase.from('membres').select('user_id, profils(nom, prenom, email)').eq('groupe_id', tournee.groupe_id),
    ])
    isTM = membre?.role === 'tm'
    isTechnicien = membre?.role === 'technicien'
    isSuperAdmin = profilMoi?.is_super_admin === true
    membresListe = (ms ?? []).map((m: any) => {
      const p = m.profils
      const nom = p?.prenom && p?.nom ? `${p.prenom} ${p.nom}` : (p?.nom || p?.email || 'Membre')
      return { user_id: m.user_id, nom }
    })
  }

  const peutEditer = isTM || isSuperAdmin
  const peutGererPJ = isTM || isTechnicien || isSuperAdmin

  const nomDe = (uid: string) =>
    membresListe.find((m) => m.user_id === uid)?.nom ?? 'Membre'

  const h = d.horaires ?? {}
  const lignes: [string, string][] = [
    ['Load-in', h.load], ['Soundcheck', h.soundcheck],
    ['Doors', h.doors], ['Set', h.set], ['Curfew', h.curfew],
  ].filter(([, v]) => v) as [string, string][]

  const retour = tournee
    ? `/groupes/${tournee.groupe_id}/tournees/${d.tournee_id}`
    : '/groupes'

  return (
    <div className="wrap">
      <Link href={retour} className="back-btn glass">
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

      {peutEditer && <EditDate d={d} />}

      <div className="label">Horaires du jour</div>
      <div className="sched glass">
        {lignes.map(([nom, heure]) => (
          <div className="row" key={nom}>
            <span className="t">{heure}</span>
            <span className="ev">{nom}</span>
          </div>
        ))}
        {lignes.length === 0 && (
          <div className="row"><span className="ev" style={{ color: 'var(--ink-dim)' }}>Aucun horaire renseigné</span></div>
        )}
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

      <div className="label">Transport</div>
      {(d.km_prochaine || d.depart_hotel) && (
        <div className="card glass">
          <div className="ic">📍</div>
          <div style={{ flex: 1 }}>
            {d.depart_hotel && <div className="h">Départ hôtel : {d.depart_hotel}</div>}
            {d.km_prochaine && <div className="d">{d.km_prochaine} km vers la prochaine date</div>}
          </div>
        </div>
      )}

      {(transports ?? []).map((t: any) => (
        <TransportItem key={t.id} t={t} nom={nomDe(t.user_id)} isTM={peutEditer} />
      ))}

      {(transports?.length ?? 0) === 0 && !peutEditer && (
        <p style={{ color: 'var(--ink-dim)', fontSize: 14, padding: '4px 8px' }}>
          Aucun transport renseigné.
        </p>
      )}

      {peutEditer && <TransportForm dateId={d.id} membres={membresListe} />}

      <div className="label">Pièces jointes</div>
      <PiecesJointes dateId={d.id} peutEditer={peutGererPJ} />

      <div className="label">Invitations</div>
      <InviteList dateId={d.id} initial={invites ?? []} isTM={peutEditer} />
      <InviteForm dateId={d.id} />
    </div>
  )
}