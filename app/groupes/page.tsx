import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../ThemeToggle'
import LogoutButton from '../LogoutButton'
import ProfileButton from '../ProfileButton'
import CreateGroupe from './CreateGroupe'
import EditGroupe from './EditGroupe'
import ConfirmDelete from '../ConfirmDelete'

export default async function GroupesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // suis-je super-admin ?
  const { data: profilMoi } = await supabase
    .from('profils')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle()
  const isSuperAdmin = profilMoi?.is_super_admin === true

  let groupes: { id: string; nom: string; role: string }[] = []

  if (isSuperAdmin) {
    // super-admin : tous les groupes de la plateforme
    const { data: tous } = await supabase
      .from('groupes')
      .select('id, nom')
      .order('nom')
    groupes = (tous ?? []).map((g) => ({ ...g, role: 'tm' }))
  } else {
    // membre normal : ses groupes
    const { data: membres } = await supabase
      .from('membres')
      .select('role, groupe_id, groupes(id, nom)')
      .eq('user_id', user.id)
    groupes = (membres ?? [])
      .filter((m) => m.groupes)
      .map((m) => ({ ...(m.groupes as any), role: m.role }))
  }

  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <h1>{isSuperAdmin ? 'Tous les groupes' : 'Mes groupes'}</h1>
          <div className="sub">{groupes.length} groupe{groupes.length > 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ProfileButton />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      <CreateGroupe isSuperAdmin={isSuperAdmin} />

      <div className="datelist">
        {groupes.map((g) => (
          <div key={g.id} className="row-with-action">
            <Link
              href={`/groupes/${g.id}`}
              className="dateitem glass"
              style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
            >
              <div className="num future" style={{ borderRadius: 12 }}>
                {g.nom.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="city">{g.nom}</div>
                <div className="meta">{g.role === 'tm' ? 'Tour Manager' : g.role}</div>
              </div>
              <div style={{ color: 'var(--ink-faint)', fontSize: 20 }}>›</div>
            </Link>
            {(g.role === 'tm' || isSuperAdmin) && (
              <>
                <EditGroupe id={g.id} nomActuel={g.nom} />
                <ConfirmDelete table="groupes" id={g.id} nom={g.nom} libelle="ce groupe" />
              </>
            )}
          </div>
        ))}
        {groupes.length === 0 && (
          <p style={{ color: 'var(--ink-dim)', fontSize: 14, padding: '8px' }}>
            Aucun groupe. Crée ton premier groupe ci-dessus.
          </p>
        )}
      </div>
    </div>
  )
}