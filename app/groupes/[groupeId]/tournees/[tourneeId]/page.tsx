import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../../../../ThemeToggle'
import LogoutButton from '../../../../LogoutButton'
import DatesLive from '../../../../dates/DatesLive'
import MapSection from '../../../../dates/MapSection'
import ImportCSV from '../../../../dates/ImportCSV'
import AddDate from '../../../../dates/AddDate'
import PiecesJointes from '../../../../dates/PiecesJointes'

export default async function TourneeDatesPage({
  params,
}: {
  params: Promise<{ groupeId: string; tourneeId: string }>
}) {
  const { groupeId, tourneeId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: tournee, error },
    { data: moi },
    { data: profilMoi },
    { data: datesRaw, error: e2 },
  ] = await Promise.all([
    supabase.from('tournees').select('nom, groupe_id').eq('id', tourneeId).single(),
    supabase.from('membres').select('role').eq('groupe_id', groupeId).eq('user_id', user.id).maybeSingle(),
    supabase.from('profils').select('is_super_admin').eq('id', user.id).maybeSingle(),
    supabase.from('dates').select('*').eq('tournee_id', tourneeId).order('jour', { ascending: true }),
  ])

  if (error || !tournee) notFound()
  if (e2) return <pre>{e2.message}</pre>

  const isTM = moi?.role === 'tm'
  const isTechnicien = moi?.role === 'technicien'
  const isSuperAdmin = profilMoi?.is_super_admin === true
  const peutEditer = isTM || isSuperAdmin
  const peutGererPJ = isTM || isTechnicien || isSuperAdmin

  // numéro = position dans la tournée triée par date (recalculé, toujours juste)
  const dates = (datesRaw ?? []).map((d, i) => ({ ...d, numero: i + 1 }))

  return (
    <div className="wrap">
      <Link href={`/groupes/${groupeId}/tournees`} className="back-btn glass">
        <span className="back-chevron">‹</span>
        <span>Tournées</span>
      </Link>

      <div className="page-head">
        <div>
          <div className="eyebrow">{tournee.nom}</div>
          <h1>Itinéraire</h1>
          <div className="sub">{dates.length} date{dates.length > 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      {peutEditer && (
        <div className="tm-actions">
          <ImportCSV tourneeId={tourneeId} />
          <AddDate tourneeId={tourneeId} />
        </div>
      )}

      <MapSection dates={dates} />

      <DatesLive initial={dates} tourneeId={tourneeId} peutEditer={peutEditer} />

      <div className="label">Documents de la tournée</div>
      <PiecesJointes tourneeId={tourneeId} peutEditer={peutGererPJ} />
    </div>
  )
}