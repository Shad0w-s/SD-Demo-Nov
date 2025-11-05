'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user'
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter()

  useEffect(() => {
    // Auth verification will be implemented
    // For now, allow all access
  }, [router])

  return <>{children}</>
}

