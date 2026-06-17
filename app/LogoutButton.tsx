'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button className="logout-btn glass" onClick={signOut} aria-label="Se déconnecter" title="Se déconnecter">
      ⏻
    </button>
  )
}