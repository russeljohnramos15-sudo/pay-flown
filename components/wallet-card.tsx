'use client'

import { Card } from '@/components/ui/card'
import { Eye, EyeOff, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface WalletCardProps {
  balance: number
  currency: string
  phone: string
  userName: string
}

export function WalletCard({
  balance,
  currency,
  phone,
  userName,
}: WalletCardProps) {
  const [showBalance, setShowBalance] = useState(true)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(phone)
    toast.success('Wallet address copied!')
  }

  return (
    <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Wallet Balance</p>
            <div className="flex items-center gap-3 mt-2">
              <h2 className="text-4xl font-bold">
                {showBalance
                  ? `${currency} ${balance.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : '••••••'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-white hover:bg-blue-500"
              >
                {showBalance ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-blue-100 text-xs">WALLET ADDRESS</p>
            <div className="flex items-center justify-between mt-1">
              <p className="font-mono text-sm">{phone}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="text-white hover:bg-blue-500"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-blue-100 text-xs">ACCOUNT HOLDER</p>
            <p className="text-sm font-medium">{userName}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
