'use client'

import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { useEffect } from 'react'
import { WalletCard } from '@/components/wallet-card'
import { RecentTransactions } from '@/components/recent-transactions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Send, HandCoins, CreditCard, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { wallet, loading, fetchWallet } = useWallet()

  useEffect(() => {
    if (user?.id) {
      fetchWallet(user.id)
    }
  }, [user?.id, fetchWallet])

  if (loading || !wallet) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {profile && (
          <WalletCard
            balance={wallet.balance}
            currency={wallet.currency}
            phone={profile.phone_number}
            userName={profile.display_name}
          />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/send">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Send Money</span>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/request">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-green-100 p-3 rounded-lg">
                <HandCoins className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Request</span>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/topup">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-purple-100 p-3 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Top-up</span>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/cashout">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Cash Out</span>
            </div>
          </Card>
        </Link>
      </div>

      {user && <RecentTransactions userId={user.id} />}
    </div>
  )
}
