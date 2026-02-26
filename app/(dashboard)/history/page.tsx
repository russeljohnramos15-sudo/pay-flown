'use client'

import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpRight, ArrowDownLeft, Download, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Transaction {
  id: string
  type: 'send' | 'receive' | 'topup' | 'cashout'
  amount: number
  description?: string
  status: 'completed' | 'pending' | 'failed'
  created_at: string
  recipient_id?: string
}

export default function TransactionHistoryPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.id) return

      try {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (wallet) {
          let query = supabase
            .from('transactions')
            .select('*')
            .eq('wallet_id', wallet.id)

          if (typeFilter !== 'all') {
            query = query.eq('type', typeFilter)
          }

          const { data } = await query
            .order('created_at', { ascending: false })

          setTransactions(data || [])
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user?.id, typeFilter])

  const getIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="h-5 w-5 text-red-500" />
      case 'receive':
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />
      default:
        return <ArrowDownLeft className="h-5 w-5 text-gray-500" />
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

  const filteredTransactions = transactions.filter((tx) =>
    tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600 mt-1">View all your transactions</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="send">Money Sent</SelectItem>
                <SelectItem value="receive">Money Received</SelectItem>
                <SelectItem value="topup">Top-up</SelectItem>
                <SelectItem value="cashout">Cash Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <p className="text-center py-12 text-gray-500">No transactions found</p>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-full">{getIcon(tx.type)}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{getLabel(tx.type)}</p>
                    <p className="text-sm text-gray-600">{tx.description || 'No description'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${tx.type === 'send' ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.type === 'send' ? '-' : '+'} PHP {tx.amount.toFixed(2)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    tx.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : tx.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
