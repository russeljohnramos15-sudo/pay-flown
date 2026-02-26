import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardNav } from '@/components/dashboard-nav'
import { ProtectedRoute } from '@/components/protected-route'

export const metadata = {
  title: 'Dashboard - Digital Wallet',
  description: 'Manage your digital wallet',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen md:flex-row">
        <DashboardNav />
        <div className="flex-1 flex flex-col overflow-hidden mb-16 md:mb-0">
          <DashboardHeader />
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
