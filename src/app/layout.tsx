import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
// ArcGIS CSS (primary)
import '@arcgis/core/assets/esri/themes/light/main.css'
// Leaflet CSS (fallback)
import 'leaflet/dist/leaflet.css'
import { MUIThemeProviderWrapper } from '@/lib/mui-theme'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

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
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body className={inter.className}>
        <MUIThemeProviderWrapper>{children}</MUIThemeProviderWrapper>
      </body>
    </html>
  )
}

