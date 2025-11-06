'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/supabaseClient'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuthAndRedirect() {
      const session = await getSession()
      
      if (session) {
        // If logged in, go to fleet overview
        router.replace('/fleet')
      } else {
        // If not logged in, go to registration
        router.replace('/auth/register')
      }
    }
    
    checkAuthAndRedirect()
  }, [router])

  // Return null while redirecting
  return null
}

