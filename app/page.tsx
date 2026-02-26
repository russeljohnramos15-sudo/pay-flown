'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        
        // Check if user is authenticated
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth error:', error)
          // If there's an error checking auth, redirect to login
          router.push('/auth/login')
          return
        }
        
        if (session?.user) {
          router.push('/dashboard')
        } else {
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Navigation error:', err)
        // On error, default to login page
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}
