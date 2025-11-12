import type { Metadata } from 'next'
import './globals.css'
import { CallProvider } from '@/contexts/CallContext'
import { UserProvider } from '@/contexts/UserContext'
import { RouteGuard } from '@/components/RouteGuard'

export const metadata: Metadata = {
  title: 'Tallac CRM',
  description: 'Modern CRM for Sales Development Representatives',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <UserProvider>
          <CallProvider>
            <RouteGuard>{children}</RouteGuard>
          </CallProvider>
        </UserProvider>
      </body>
    </html>
  )
}

