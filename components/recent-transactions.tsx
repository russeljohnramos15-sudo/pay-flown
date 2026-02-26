'use client'

import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Send,
  HandCoins,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Transaction {
  id: string
  type: 'send' | 'receive' | 'topup' | 'cashout'
  amount: number
  description?: string
  status: 'completed' | 'pending' | 'failed'
  created_at: string
}

export function RecentTransactions({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (wallet) {
          const { data } = await supabase
            .from('transactions')
            .select('*')
            .eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false })
            .limit(5)

          setTransactions(data || [])
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [userId])

  const getIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="h-5 w-5 text-red-500" />
      case 'receive':
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />
      case 'topup':
        return <Wallet className="h-5 w-5 text-blue-500" />
      default:
        return <Send className="h-5 w-5 text-gray-500" />
    }
  }

  const getLabel = (type: string) => {
    switch (type) {
      case 'send':
        return 'Money Sent'
      case 'receive':
        return 'Money Received'
      case 'topup':
        return 'Top-up'
      case 'cashout':
        return 'Cash Out'
      default:
        return 'Transaction'
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        <Link href="/dashboard/history">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No transactions yet</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full">{getIcon(tx.type)}</div>
                <div>
                  <p className="font-medium text-gray-900">{getLabel(tx.type)}</p>
                  <p className="text-xs text-gray-600">{tx.description || 'No description'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${tx.type === 'send' ? 'text-red-600' : 'text-green-600'}`}>
                  {tx.type === 'send' ? '-' : '+'} PHP {tx.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">
                  {new Date(tx.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
