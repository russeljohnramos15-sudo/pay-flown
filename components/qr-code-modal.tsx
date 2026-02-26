'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Share2, Download, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface QRCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phone: string
  amount?: number
  recipientName?: string
}

export function QRCodeModal({
  open,
  onOpenChange,
  phone,
  amount,
  recipientName,
}: QRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerateQR = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount }),
      })

      if (!response.ok) throw new Error('Failed to generate QR')

      const data = await response.json()
      setQrCode(data.qrCode)
    } catch (error) {
      toast.error('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!qrCode) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Payment Request from ${recipientName || 'Wallet'}`,
          text: `Pay PHP ${amount || 0} to ${phone}`,
          url: window.location.href,
        })
      } else {
        toast.error('Share not supported on this browser')
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleDownload = () => {
    if (!qrCode) return

    const link = document.createElement('a')
    link.href = qrCode
    link.download = `qr-payment-${phone}.png`
    link.click()
    toast.success('QR code downloaded')
  }

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phone)
    toast.success('Wallet address copied!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Payment QR Code</DialogTitle>
          <DialogDescription>
            Share this QR code so others can send you money easily
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!qrCode && (
            <Button
              onClick={handleGenerateQR}
              disabled={loading}
              className="w-full bg-blue-600"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </Button>
          )}

          {qrCode && (
            <>
              <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-center">
                <img
                  src={qrCode}
                  alt="Payment QR Code"
                  className="w-64 h-64"
                />
              </div>

              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Wallet Address</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-mono truncate">{phone}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPhone}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {amount && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-lg font-bold text-blue-600">PHP {amount}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex-1"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
