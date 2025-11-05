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
      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 dark:bg-red-500/10 dark:hover:bg-red-500/20 border border-red-500/30 dark:border-red-500/20 rounded-lg text-primary text-sm transition-colors"
    >
      Logout
    </button>
  )
}

