import { getServerClient } from '@/lib/supabase'
import { requestMoneySchema } from '@/lib/validators'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = requestMoneySchema.parse(body)

    const serverClient = getServerClient()

    // Get current user from headers
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find recipient by phone number
    const { data: recipientProfile } = await serverClient
      .from('profiles')
      .select('*')
      .eq('phone_number', validatedData.recipientPhone)
      .single()

    if (!recipientProfile) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Create payment request
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const { data: paymentRequest, error } = await serverClient
      .from('payment_requests')
      .insert({
        requester_id: userId,
        recipient_id: recipientProfile.user_id,
        amount: validatedData.amount,
        message: validatedData.message,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create payment request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentRequest,
      message: 'Payment request created successfully',
    })
  } catch (error) {
    console.error('Request money error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment request' },
      { status: 500 }
    )
  }
}
