import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../../../../ThemeToggle'
import LogoutButton from '../../../../LogoutButton'
import DatesLive from '../../../../dates/DatesLive'
import MapSection from '../../../../dates/MapSection'
import ImportCSV from '../../../../dates/ImportCSV'
import AddDate from '../../../../dates/AddDate'

export default async function TourneeDatesPage({
  params,
}: {
  params: Promise<{ groupeId: string; tourneeId: string }>
}) {
  const { groupeId, tourneeId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tournee, error } = await supabase
    .from('tournees')
    .select('nom, groupe_id')
    .eq('id', tourneeId)
    .single()
  if (error || !tournee) notFound()

  const { data: moi } = await supabase
    .from('membres')
    .select('role')
    .eq('groupe_id', groupeId)
    .eq('user_id', user.id)
    .single()
  const isTM = moi?.role === 'tm'

  const { data: dates, error: e2 } = await supabase
    .from('dates')
    .select('*')
    .eq('tournee_id', tourneeId)
    .order('jour', { ascending: true })

  if (e2) return <pre>{e2.message}</pre>

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
          <div className="sub">{dates?.length ?? 0} date{(dates?.length ?? 0) > 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      {isTM && (
        <div className="tm-actions">
          <ImportCSV tourneeId={tourneeId} />
          <AddDate tourneeId={tourneeId} />
        </div>
      )}

      <MapSection dates={dates ?? []} />

      <DatesLive initial={dates ?? []} tourneeId={tourneeId} />
    </div>
  )
}