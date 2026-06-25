import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../ThemeToggle'
import LogoutButton from '../LogoutButton'
import AdminConsole from './AdminConsole'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // garde-fou : réservé au super-admin
  const { data: profil } = await supabase
    .from('profils')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (profil?.is_super_admin !== true) redirect('/groupes')

  // liste des groupes pour les menus
  const { data: groupes } = await supabase
    .from('groupes')
    .select('id, nom')
    .order('nom')

  return (
    <div className="wrap">
      <Link href="/groupes" className="back-btn glass">
        <span className="back-chevron">‹</span>
        <span>Mes groupes</span>
      </Link>

      <div className="page-head">
        <div>
          <div className="eyebrow">Super-admin</div>
          <h1>Utilisateurs</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      <AdminConsole groupes={groupes ?? []} />
    </div>
  )
}