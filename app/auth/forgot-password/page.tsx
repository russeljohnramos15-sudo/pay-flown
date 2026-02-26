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

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'phone' | 'otp' | 'reset'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!phone) {
        setError('Please enter your phone number')
        setLoading(false)
        return
      }

      // Verify phone exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', phone)
        .single()

      if (profileError || !profile) {
        setError('Phone number not found')
        setLoading(false)
        return
      }

      // Generate OTP (in real app, send via SMS)
      const generatedOtp = Math.random().toString().substring(2, 8)
      localStorage.setItem('resetOtp', generatedOtp)
      localStorage.setItem('resetPhone', phone)

      toast.success(`OTP: ${generatedOtp} (for demo purposes)`)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const storedOtp = localStorage.getItem('resetOtp')
      if (otp !== storedOtp) {
        setError('Invalid OTP')
        setLoading(false)
        return
      }

      setStep('reset')
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!newPassword || newPassword.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      const resetPhone = localStorage.getItem('resetPhone')
      if (!resetPhone) {
        setError('Session expired. Please start over.')
        setLoading(false)
        return
      }

      // Find user by phone
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', resetPhone)
        .single()

      if (profileError || !profiles) {
        setError('User not found')
        setLoading(false)
        return
      }

      // Update password via Supabase admin (client-side would need RLS bypass)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      // Clear stored values
      localStorage.removeItem('resetOtp')
      localStorage.removeItem('resetPhone')

      toast.success('Password reset successfully!')
      router.push('/auth/login')
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
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
            <p className="text-gray-600 mt-2">Reset Your Password</p>
          </div>

          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-6">
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              {error && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Enter OTP Code
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500">Check the toast notification for OTP</p>
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
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {error && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <Lock className="inline-block mr-2 h-4 w-4" />
                  New Password (6+ chars)
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Back to Login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
