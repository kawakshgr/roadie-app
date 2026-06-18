import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../ThemeToggle'
import CompteForm from './CompteForm'

export default async function ComptePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="wrap">
      <Link href="/groupes" className="back-btn glass">
        <span className="back-chevron">‹</span>
        <span>Mes groupes</span>
      </Link>

      <div className="page-head">
        <div>
          <div className="eyebrow">Compte</div>
          <h1>Mon profil</h1>
          <div className="sub">{user.email}</div>
        </div>
        <ThemeToggle />
      </div>

      <CompteForm profil={profil ?? { id: user.id }} email={user.email ?? ''} />
    </div>
  )
}