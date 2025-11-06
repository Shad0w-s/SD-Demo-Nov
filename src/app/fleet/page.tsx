'use client'

import { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import NavigationToolbar from '@/components/NavigationToolbar'
import FleetOverview from '@/components/FleetOverview'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function FleetPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <AuthGuard>
      <NavigationToolbar searchValue={searchQuery} onSearchChange={setSearchQuery} />
      <FleetOverview searchQuery={searchQuery} />
    </AuthGuard>
  )
}

