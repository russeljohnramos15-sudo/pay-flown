'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, Loader2, Phone, User, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SignUpPage() {
  const [step, setStep] = useState<'info' | 'verify'>('info')
  const [phone, setPhone] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!phone || !displayName || !password) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      // Create account with email and password
      const randomId = Math.random().toString(36).substring(2, 10)
      const email = `user_${randomId}@payflown.local`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone_number: phone,
            display_name: displayName,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Create profile
        await supabase.from('profiles').insert({
          id: data.user.id,
          display_name: displayName,
          phone_number: phone,
        })

        // Create wallet
        await supabase.from('wallets').insert({
          user_id: data.user.id,
          balance: 0,
          currency: 'PHP',
        })

        toast.success('Account created successfully!')
        router.push('/auth/login')
      }
    } catch (err: any) {
      const message = err.message || 'Failed to create account'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">PayFlown</h1>
            <p className="text-gray-600 mt-2">Create Your Wallet</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                <User className="inline-block mr-2 h-4 w-4" />
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Juan Dela Cruz"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                <Phone className="inline-block mr-2 h-4 w-4" />
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="09XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                <Lock className="inline-block mr-2 h-4 w-4" />
                Password (6+ chars)
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
