import { generateQRCodeForPayment } from '@/lib/qr-generator'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, amount } = await req.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number required' },
        { status: 400 }
      )
    }

    const qrCodeUrl = await generateQRCodeForPayment(phone, amount || 0)

    return NextResponse.json({
      qrCode: qrCodeUrl,
    })
  } catch (error) {
    console.error('QR generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
