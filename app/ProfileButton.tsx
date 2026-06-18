'use client'
import { useRouter } from 'next/navigation'

export default function ProfileButton() {
  const router = useRouter()
  return (
    <button
      className="logout-btn glass"
      onClick={() => router.push('/compte')}
      aria-label="Mon compte"
      title="Mon compte"
    >
      👤
    </button>
  )
}