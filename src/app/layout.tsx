import type { Metadata } from 'next'
import '../styles/globals.css'
// ArcGIS CSS (primary)
import '@arcgis/core/assets/esri/themes/light/main.css'
// Leaflet CSS (fallback)
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

