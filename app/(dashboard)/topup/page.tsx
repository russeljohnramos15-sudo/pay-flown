'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2, CreditCard, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'

export default function TopUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { wallet, fetchWallet } = useWallet()
  const supabase = createClient()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Check if redirected from successful checkout
  if (searchParams.get('session_id') && !success) {
    setSuccess(true)
    if (user?.id) {
      fetchWallet(user.id)
    }
  }

  const predefinedAmounts = [100, 500, 1000, 2500, 5000, 10000]

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!user) {
      toast.error('Please log in first')
      return
    }

    setLoading(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const data = await response.json()
      if (data.session?.url) {
        window.location.href = data.session.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to proceed to checkout'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Top-up Successful!</h1>
          <p className="text-gray-600 mb-6">Your wallet has been credited with PHP {amount}</p>
          <Button onClick={() => router.push('/dashboard')} className="bg-blue-600">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Top-up Your Wallet</h1>
          <p className="text-gray-600 mt-1">Add funds using Stripe</p>
        </div>

        {wallet && (
          <Card className="p-4 bg-blue-50 border-blue-200 mb-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-3xl font-bold text-blue-600">
                PHP {wallet.balance.toFixed(2)}
              </p>
            </div>
          </Card>
        )}

        <form onSubmit={handleTopUp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="inline-block mr-2 h-4 w-4" />
              Amount (PHP)
            </label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              step="1"
              min="1"
              className="text-lg"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Select</p>
            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === preset.toString() ? 'default' : 'outline'}
                  onClick={() => setAmount(preset.toString())}
                  disabled={loading}
                  className={amount === preset.toString() ? 'bg-blue-600' : ''}
                >
                  PHP {preset.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              PHP {parseFloat(amount || '0').toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 mt-3">
              You will be redirected to Stripe to complete the payment securely.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Payment
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> This is a demo integration. In production, ensure your Stripe webhook is properly configured to handle payment confirmations.
          </p>
        </div>
      </Card>
    </div>
  )
}
