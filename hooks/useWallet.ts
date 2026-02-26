'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Wallet {
  id: string
  user_id: string
  balance: number
  currency: string
  created_at: string
  updated_at: string
}

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchWallet = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      setWallet(data as Wallet)
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateBalance = useCallback(async (userId: string, newBalance: number) => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      setWallet(data as Wallet)
      return data
    } catch (error) {
      console.error('Error updating balance:', error)
      throw error
    }
  }, [])

  return { wallet, loading, fetchWallet, updateBalance }
}
