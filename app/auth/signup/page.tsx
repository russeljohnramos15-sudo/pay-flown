'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, Loader2, Phone, Lock, User, CheckCircle } from 'lucide-react'
import { useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SignUpPage() {
  const [step, setStep] = useState<'details' | 'success'>('details')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retryAfter, setRetryAfter] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [retryAfter])

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length < 10) return 'Phone number must be at least 10 digits'
    return ''
  }

  const validatePassword = (value: string) => {
    if (value.length < 6) return 'Password must be at least 6 characters'
    if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter'
    if (!/[a-z]/.test(value)) return 'Password must contain lowercase letter'
    if (!/[0-9]/.test(value)) return 'Password must contain a number'
    return ''
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const phoneError = validatePhone(phone)
    if (phoneError) {
      setError(phoneError)
      return
    }

    if (!name.trim()) {
      setError('Full name is required')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const cleanPhone = phone.replace(/\D/g, '')
      const uniqueEmail = `user_${cleanPhone}_${Date.now()}@payflown.local`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: uniqueEmail,
        password,
        options: {
          data: {
            phone_number: phone,
            full_name: name,
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('rate limit')) {
          setRetryAfter(60)
          setError('Too many signup attempts. Please try again in 60 seconds.')
        } else if (signUpError.message.includes('invalid')) {
          setError('Invalid email or phone number. Please check and try again.')
        } else {
          setError(signUpError.message || 'Signup failed. Please try again.')
        }
        toast.error(signUpError.message)
        return
      }

      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              phone_number: phone,
              display_name: name,
            })

          if (profileError && !profileError.message.includes('duplicate')) {
            console.error('Profile creation error:', profileError)
          }

          const { error: walletError } = await supabase
            .from('wallets')
            .insert({
              user_id: data.user.id,
              balance: 0,
              currency: 'PHP',
            })

          if (walletError && !walletError.message.includes('duplicate')) {
            console.error('Wallet creation error:', walletError)
          }
        } catch (err) {
          console.error('Profile/wallet setup error:', err)
        }

        setStep('success')
        toast.success('Account created! Redirecting to login...')
        setTimeout(() => router.push('/auth/login'), 2000)
      }
    } catch (err: any) {
      const message = err.message || 'An unexpected error occurred'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h1>
            <p className="text-gray-600 mb-6">Your PayFlown wallet is ready. Redirecting to login...</p>
            <Button onClick={() => router.push('/auth/login')} className="w-full bg-blue-600 hover:bg-blue-700">
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">PayFlown</h1>
            <p className="text-gray-600 mt-2">Create Your Wallet Account</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                  {retryAfter > 0 && (
                    <p className="text-xs text-red-600 mt-1">Retry available in {retryAfter}s</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <User className="inline-block mr-2 h-4 w-4" />
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Juan Dela Cruz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || retryAfter > 0}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Phone className="inline-block mr-2 h-4 w-4" />
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="09171234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading || retryAfter > 0}
                required
              />
              <p className="text-xs text-gray-500">10+ digits, e.g., 09171234567 or +63917123456</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Lock className="inline-block mr-2 h-4 w-4" />
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || retryAfter > 0}
                required
              />
              <p className="text-xs text-gray-500">Min 6 chars, uppercase, lowercase, number</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Lock className="inline-block mr-2 h-4 w-4" />
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || retryAfter > 0}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || retryAfter > 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : retryAfter > 0 ? (
                `Retry in ${retryAfter}s`
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
