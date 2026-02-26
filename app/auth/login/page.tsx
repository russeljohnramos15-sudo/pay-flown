'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, Loader2, Phone, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!phone || !password) {
        setError('Please enter phone number and password')
        setLoading(false)
        return
      }

      // Find user by phone number
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', phone)
        .single()

      if (profileError || !profiles) {
        setError('Phone number not found')
        setLoading(false)
        return
      }

      // Get user's email from auth
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
      const user = users?.users.find((u) => u.user_metadata?.phone_number === phone)

      if (!user || usersError) {
        setError('User not found')
        setLoading(false)
        return
      }

      // Sign in with email and password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password,
      })

      if (signInError) throw signInError

      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (err: any) {
      const message = err.message || 'Failed to login'
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

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

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
                Password
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <div>
              <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                Forgot Password?
              </Link>
            </div>
            <div>
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
