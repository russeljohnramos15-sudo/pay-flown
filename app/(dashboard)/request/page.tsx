'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Phone, DollarSign, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export default function RequestMoneyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const [recipientPhone, setRecipientPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipientInfo, setRecipientInfo] = useState<any>(null)

  const handleSearchRecipient = async () => {
    if (!recipientPhone) {
      toast.error('Please enter a phone number')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/contacts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: recipientPhone }),
      })

      if (!response.ok) {
        throw new Error('Recipient not found')
      }

      const data = await response.json()
      setRecipientInfo(data.profile)
      toast.success('Recipient found!')
    } catch (error) {
      toast.error('Recipient not found')
      setRecipientInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestMoney = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recipientPhone || !amount || !recipientInfo || !user) {
      toast.error('Please fill in all required fields')
      return
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('payment_requests')
        .insert({
          from_user_id: recipientInfo.id,
          to_user_id: user.id,
          amount: parseFloat(amount),
          reason: message || undefined,
          status: 'pending',
        })

      if (error) throw error

      toast.success('Payment request sent!')
      router.push('/dashboard')
    } catch (error) {
      const message_err = error instanceof Error ? error.message : 'Failed to request money'
      toast.error(message_err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Request Money</h1>
          <p className="text-gray-600 mt-1">Ask someone to send you money</p>
        </div>

        <form onSubmit={handleRequestMoney} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <Phone className="inline-block mr-2 h-4 w-4" />
              Request from Phone Number
            </label>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="+63 9XX XXX XXXX"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                disabled={loading || !!recipientInfo}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearchRecipient}
                disabled={loading || !!recipientInfo}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
              {recipientInfo && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRecipientInfo(null)
                    setRecipientPhone('')
                    setAmount('')
                    setMessage('')
                  }}
                >
                  Change
                </Button>
              )}
            </div>
          </div>

          {recipientInfo && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {recipientInfo.display_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{recipientInfo.display_name}</p>
                  <p className="text-sm text-gray-600">{recipientInfo.phone_number}</p>
                </div>
              </div>
            </Card>
          )}

          {recipientInfo && (
            <>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <DollarSign className="inline-block mr-2 h-4 w-4" />
                  Amount (PHP)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <MessageSquare className="inline-block mr-2 h-4 w-4" />
                  Message (Optional)
                </label>
                <Textarea
                  placeholder="Add a note to your request"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Request Amount</span>
                  <span className="text-lg font-bold text-green-600">PHP {parseFloat(amount || '0').toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </>
          )}
        </form>
      </Card>
    </div>
  )
}

const handleRequestMoney = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!recipientPhone || !amount || !recipientInfo || !user) {
    toast.error('Please fill in all required fields')
    return
  }

  if (parseFloat(amount) <= 0) {
    toast.error('Amount must be greater than 0')
    return
  }

  setLoading(true)
  try {
    const response = await fetch('/api/transactions/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          recipientPhone,
          amount: parseFloat(amount),
          message: message || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success('Payment request sent!')
      router.push('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to request money'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Request Money</h1>
          <p className="text-gray-600 mt-1">Ask someone to send you money</p>
        </div>

        <form onSubmit={handleRequestMoney} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <Phone className="inline-block mr-2 h-4 w-4" />
              Request from Phone Number
            </label>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="+63 9XX XXX XXXX"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                disabled={loading || !!recipientInfo}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearchRecipient}
                disabled={loading || !!recipientInfo}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
              {recipientInfo && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRecipientInfo(null)
                    setRecipientPhone('')
                    setAmount('')
                    setMessage('')
                  }}
                >
                  Change
                </Button>
              )}
            </div>
          </div>

          {recipientInfo && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {recipientInfo.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{recipientInfo.full_name}</p>
                  <p className="text-sm text-gray-600">{recipientInfo.phone_number}</p>
                </div>
              </div>
            </Card>
          )}

          {recipientInfo && (
            <>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <DollarSign className="inline-block mr-2 h-4 w-4" />
                  Amount (PHP)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <MessageSquare className="inline-block mr-2 h-4 w-4" />
                  Message (Optional)
                </label>
                <Textarea
                  placeholder="Add a note to your request"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Request Amount</span>
                  <span className="text-lg font-bold text-green-600">PHP {parseFloat(amount || '0').toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </>
          )}
        </form>
      </Card>
    </div>
  )
}
