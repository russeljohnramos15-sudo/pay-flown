'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrendingDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function CashOutPage() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [bankDetails, setBankDetails] = useState('')

  const handleCashOut = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !bankDetails) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Cash-out request submitted. Processing...')
      setAmount('')
      setBankDetails('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cash Out</h1>
          <p className="text-gray-600 mt-1">Transfer money from your wallet to your bank account</p>
        </div>

        <form onSubmit={handleCashOut} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (PHP)
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Account Details
            </label>
            <Input
              type="text"
              placeholder="Account number or details"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !amount || !bankDetails}
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <TrendingDown className="mr-2 h-4 w-4" />
                Request Cash Out
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  )
}
