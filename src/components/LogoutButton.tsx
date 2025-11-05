'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@mui/material'
import { Logout } from '@mui/icons-material'
import { signOut } from '@/lib/supabaseClient'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <Button
      variant="outlined"
      color="error"
      size="small"
      startIcon={<Logout />}
      onClick={handleLogout}
      sx={{ borderRadius: 2 }}
    >
      Logout
    </Button>
  )
}
