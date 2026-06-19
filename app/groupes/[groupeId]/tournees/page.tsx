import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../../../ThemeToggle'
import LogoutButton from '../../../LogoutButton'
import CreateTournee from './CreateTournee'
import EditTournee from './EditTournee'
import ConfirmDelete from '../../../ConfirmDelete'

function fmtPeriode(debut: string | null, fin: string | null) {
  if (!debut) return 'Dates à définir'
  const opt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const d = new Date(debut).toLocaleDateString('fr-FR', opt)
  if (!fin) return `À partir du ${d}`
  const f = new Date(fin).toLocaleDateString('fr-FR', opt)
  return `${d} → ${f}`
}

export default async function TourneesPage({
  params,
}: {
  params: Promise<{ groupeId: string }>
}) {
  const { groupeId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: groupe, error } = await supabase
    .from('groupes')
    .select('nom')
    .eq('id', groupeId)
    .single()
  if (error || !groupe) notFound()

  const { data: moi } = await supabase
    .from('membres')
    .select('role')
    .eq('groupe_id', groupeId)
    .eq('user_id', user.id)
    .maybeSingle()
  const isTM = moi?.role === 'tm'

  const { data: profilMoi } = await supabase
    .from('profils')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle()
  const isSuperAdmin = profilMoi?.is_super_admin === true

  const peutEditer = isTM || isSuperAdmin

  const { data: tournees } = await supabase
    .from('tournees')
    .select('id, nom, debut, fin')
    .eq('groupe_id', groupeId)
    .order('debut', { ascending: false })

  return (
    <div className="wrap">
      <Link href={`/groupes/${groupeId}`} className="back-btn glass">
        <span className="back-chevron">‹</span>
        <span>{groupe.nom}</span>
      </Link>

      <div className="page-head">
        <div>
          <div className="eyebrow">{groupe.nom}</div>
          <h1>Tournées</h1>
          <div className="sub">{(tournees?.length ?? 0)} tournée{(tournees?.length ?? 0) > 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      {peutEditer && <CreateTournee groupeId={groupeId} />}

      <div className="datelist">
        {(tournees ?? []).map((t) => (
          <div key={t.id} className="row-with-action">
            <Link
              href={`/groupes/${groupeId}/tournees/${t.id}`}
              className="dateitem glass"
              style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
            >
              <div className="num future" style={{ borderRadius: 12 }}>🗺</div>
              <div style={{ flex: 1 }}>
                <div className="city">{t.nom}</div>
                <div className="meta">{fmtPeriode(t.debut, t.fin)}</div>
              </div>
              <div style={{ color: 'var(--ink-faint)', fontSize: 20 }}>›</div>
            </Link>
            {peutEditer && (
              <>
                <EditTournee id={t.id} nomActuel={t.nom} />
                <ConfirmDelete table="tournees" id={t.id} nom={t.nom} libelle="cette tournée" />
              </>
            )}
          </div>
        ))}
        {(tournees?.length ?? 0) === 0 && (
          <p style={{ color: 'var(--ink-dim)', fontSize: 14, padding: '8px' }}>
            Aucune tournée. {peutEditer ? 'Crée la première ci-dessus.' : ''}
          </p>
        )}
      </div>
    </div>
  )
}