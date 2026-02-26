'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QRCodeModal } from '@/components/qr-code-modal'
import { useState } from 'react'
import { QrCode } from 'lucide-react'

export default function ShareWalletPage() {
  const { profile } = useAuth()
  const [showQR, setShowQR] = useState(true)

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Share Your Wallet</h1>
          <p className="text-gray-600 mt-1">Let others send you money using your QR code</p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-2">Your Wallet Address</p>
            <p className="text-lg font-mono font-semibold text-blue-600">
              {profile?.phone_number}
            </p>
          </div>

          <Button
            onClick={() => setShowQR(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <QrCode className="mr-2 h-5 w-5" />
            Generate & Share QR Code
          </Button>
        </div>
      </Card>

      {profile && (
        <QRCodeModal
          open={showQR}
          onOpenChange={setShowQR}
          phone={profile.phone_number}
          recipientName={profile.full_name}
        />
      )}
    </div>
  )
}
