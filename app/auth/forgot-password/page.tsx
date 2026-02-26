'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, Loader2, Phone, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type ForgotPasswordStep = 'phone' | 'verify-otp' | 'reset-password' | 'success'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ForgotPasswordStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('123456')
  const [resendTimer, setResendTimer] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const phoneError = validatePhone(phone)
    if (phoneError) {
      setError(phoneError)
      return
    }

    setLoading(true)
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', phone)
        .single()

      if (profileError || !profileData) {
        setError('Phone number not registered. Please sign up first.')
        toast.error('Phone number not found')
        setLoading(false)
        return
      }

      setOtpSent(true)
      setOtpCode(Math.random().toString().slice(2, 8))
      setResendTimer(60)
      setStep('verify-otp')
      toast.success(`OTP sent! Demo OTP: ${setOtpCode}`)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (otp !== otpCode) {
      setError(`Invalid OTP. Demo code is: ${otpCode}`)
      return
    }

    setStep('reset-password')
    toast.success('OTP verified! Now reset your password.')
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const cleanPhone = phone.replace(/\D/g, '')
      
      const { data: authUsers } = await supabase.auth.admin.listUsers() || { data: { users: [] } }
      
      const userAuth = authUsers?.find((u: any) => 
        u.user_metadata?.phone_number === phone
      )

      if (!userAuth) {
        setError('User not found')
        toast.error('User not found')
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userAuth.id,
        { password: newPassword }
      )

      if (updateError) {
        setError(updateError.message || 'Failed to reset password')
        toast.error(updateError.message)
        setLoading(false)
        return
      }

      setStep('success')
      toast.success('Password reset successfully!')
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
      toast.error('Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <Mail className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
            <p className="text-gray-600 mb-6">Your password has been reset successfully. Redirecting to login...</p>
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
            <p className="text-gray-600 mt-2">Reset Your Password</p>
          </div>

          <form onSubmit={step === 'phone' ? handleSendOTP : step === 'verify-otp' ? handleVerifyOTP : handleResetPassword} className="space-y-4">
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {step === 'phone' && (
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
            )}

            {step === 'verify-otp' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Lock className="inline-block mr-2 h-4 w-4" />
                  Enter OTP Code
                </label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500">Check your email for the 6-digit code</p>
                {resendTimer > 0 && (
                  <p className="text-xs text-gray-500">Resend OTP in {resendTimer}s</p>
                )}
                {resendTimer === 0 && otpSent && (
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendOTP}
                    className="w-full"
                  >
                    Resend OTP
                  </Button>
                )}
              </div>
            )}

            {step === 'reset-password' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Lock className="inline-block mr-2 h-4 w-4" />
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
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
                    disabled={loading}
                    required
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : step === 'phone' ? (
                'Send OTP'
              ) : step === 'verify-otp' ? (
                'Verify OTP'
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Remember your password?{' '}
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
