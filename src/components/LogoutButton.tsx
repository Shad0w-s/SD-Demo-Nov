'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/supabaseClient'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-white text-sm"
    >
      Logout
    </button>
  )
}

