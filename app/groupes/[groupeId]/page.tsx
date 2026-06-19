import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../../ThemeToggle'
import LogoutButton from '../../LogoutButton'
import MembreRow from './MembreRow'
import InviteMembre from './InviteMembre'

export default async function GroupePage({
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
    .select('*')
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

  const { data: membres } = await supabase
    .from('membres')
    .select('id, role, user_id, profils(pseudo, prenom, nom, email)')
    .eq('groupe_id', groupeId)

  const { data: tournees } = await supabase
    .from('tournees')
    .select('id, nom')
    .eq('groupe_id', groupeId)

  return (
    <div className="wrap">
      <Link href="/groupes" className="back-btn glass">
        <span className="back-chevron">‹</span>
        <span>Mes groupes</span>
      </Link>

      <div className="page-head">
        <div>
          <div className="eyebrow">Groupe</div>
          <h1>{groupe.nom}</h1>
          <div className="sub">
            {(membres?.length ?? 0)} membre{(membres?.length ?? 0) > 1 ? 's' : ''} · {(tournees?.length ?? 0)} tournée{(tournees?.length ?? 0) > 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      <Link href={`/groupes/${groupeId}/tournees`} className="import-btn glass" style={{ marginBottom: 8 }}>
        🗺 Voir les tournées
      </Link>

      {peutEditer && <InviteMembre groupeId={groupeId} />}

      <div className="label">Équipe</div>
      {(membres ?? []).map((m) => (
        <MembreRow
          key={m.id}
          membre={m as any}
          isTM={peutEditer}
          estMoi={m.user_id === user.id}
        />
      ))}
    </div>
  )
}