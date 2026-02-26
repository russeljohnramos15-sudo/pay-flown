'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, Loader2, Phone, Lock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length < 10) return 'Phone number must be at least 10 digits'
    return ''
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const phoneError = validatePhone(phone)
    if (phoneError) {
      setError(phoneError)
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    setLoading(true)
    try {
      const cleanPhone = phone.replace(/\D/g, '')
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', phone)
        .single()

      if (profileError || !profileData) {
        setError('Phone number not found. Please sign up first.')
        toast.error('Invalid phone number or account does not exist')
        return
      }

      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: `user_${cleanPhone}_*`,
        password,
      })

      if (authError && authError.message.includes('Invalid login credentials')) {
        const { data: authUsers } = await supabase.auth.admin.listUsers() || { data: { users: [] } }
        
        const userAuth = authUsers?.find((u: any) => 
          u.user_metadata?.phone_number === phone
        )

        if (userAuth) {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: userAuth.email || `user_${cleanPhone}_fallback@payflown.local`,
            password,
          })

          if (signInError) {
            setError('Invalid password. Please try again.')
            toast.error('Invalid password')
            return
          }

          if (data.user) {
            toast.success('Login successful!')
            router.push('/dashboard')
            return
          }
        } else {
          setError('Invalid password. Please try again.')
          toast.error('Invalid credentials')
          return
        }
      }

      if (authError) {
        setError(authError.message || 'Login failed')
        toast.error(authError.message)
        return
      }

      if (user) {
        toast.success('Login successful!')
        router.push('/dashboard')
      }
    } catch (err: any) {
      const message = err.message || 'An unexpected error occurred'
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
            <p className="text-gray-600 mt-2">Sign In to Your Wallet</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

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
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  <Lock className="inline-block mr-2 h-4 w-4" />
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">
                  Forgot?
                </Link>
              </div>
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
