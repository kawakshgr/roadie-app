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

  // Vague 2 : tournée + ce qui ne dépend que de la date + les dates de la tournée (pour le numéro)
  const [
    { data: tournee },
    { data: invites },
    { data: transports },
    { data: datesTournee },
  ] = await Promise.all([
    supabase.from('tournees').select('groupe_id').eq('id', d.tournee_id).single(),
    supabase.from('invitations').select('*').eq('date_id', d.id).order('created_at', { ascending: true }),
    supabase.from('transports').select('*').eq('date_id', d.id),
    supabase.from('dates').select('id, jour').eq('tournee_id', d.tournee_id).order('jour', { ascending: true }),
  ])

  // numéro = position de cette date dans sa tournée (triée par date)
  const numeroDate = (datesTournee ?? []).findIndex((x) => x.id === d.id) + 1

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

  // un horaire peut être une chaîne (ancien/simple) ou {debut, fin} (plage)
  function fmtHoraire(v: any): string {
    if (!v) return ''
    if (typeof v === 'string') return v
    if (v.debut && v.fin) {
      const [hd, md] = v.debut.split(':').map(Number)
      const [hf, mf] = v.fin.split(':').map(Number)
      let mins = (hf * 60 + mf) - (hd * 60 + md)
      if (mins < 0) mins += 24 * 60
      const dh = Math.floor(mins / 60), dm = mins % 60
      const duree = dh === 0 ? `${dm} min` : dm === 0 ? `${dh}h` : `${dh}h${String(dm).padStart(2, '0')}`
      return `${v.debut} → ${v.fin} (${duree})`
    }
    return v.debut || v.fin || ''
  }

  const lignes: [string, string][] = [
    ['Load-in', fmtHoraire(h.load)],
    ['Soundcheck', fmtHoraire(h.soundcheck)],
    ['Repas', fmtHoraire(h.repas)],
    ['Doors', fmtHoraire(h.doors)],
    ['Set', fmtHoraire(h.set)],
    ['Curfew', fmtHoraire(h.curfew)],
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
          <div className="eyebrow">Jour {numeroDate} · {fmtLong(d.jour)}</div>
          <h1>{d.ville}</h1>
          <div className="sub">{d.salle}{d.adresse ? ` · ${d.adresse}` : ''}</div>
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
          <div className="label">Hébergement</div>
          <div className="card glass">
            <div className="ic">🛏</div>
            <div style={{ flex: 1 }}>
              <div className="h">{d.hebergement.hotel}</div>
              {d.hebergement.adresse && <div className="d">{d.hebergement.adresse}</div>}
              {Array.isArray(d.hebergement.chambres) && d.hebergement.chambres.length > 0 && (
                <div className="d">
                  {d.hebergement.chambres
                    .map((c: any) => `${c.nombre ?? ''} ${c.type}`.trim())
                    .join(' · ')}
                </div>
              )}
              {d.remarques && (
        <>
          <div className="label">Remarques</div>
          <div className="card glass">
            <div className="ic">📝</div>
            <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{d.remarques}</div>
          </div>
        </>
      )}
              {d.hebergement.reservation && (
                <div className="d">Réf : {d.hebergement.reservation}</div>
              )}
              <div className="d" style={{ marginTop: 2 }}>
                {d.hebergement.parking_van && <span>🚐 Parking van</span>}
                {d.hebergement.parking_van && d.hebergement.petit_dej && <span> · </span>}
                {d.hebergement.petit_dej && <span>🥐 Petit-déj inclus</span>}
              </div>
              {d.hebergement.note && (
                <div className="d" style={{ marginTop: 2, fontStyle: 'italic' }}>{d.hebergement.note}</div>
              )}
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
     <InviteList dateId={d.id} initial={invites ?? []} isTM={peutEditer} ville={d.ville} jour={d.jour} />
      <InviteForm dateId={d.id} />
    </div>
  )
}