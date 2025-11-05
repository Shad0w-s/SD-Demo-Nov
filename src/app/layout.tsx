import type { Metadata } from 'next'
import '../styles/globals.css'
import 'leaflet/dist/leaflet.css'
import { MUIThemeProviderWrapper } from '@/lib/mui-theme'

export const metadata: Metadata = {
  title: 'Drone Management System',
  description: 'MVP Drone Management System for internal testing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <MUIThemeProviderWrapper>{children}</MUIThemeProviderWrapper>
      </body>
    </html>
  )
}

