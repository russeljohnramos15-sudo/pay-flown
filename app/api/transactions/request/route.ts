import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { recipientPhone, amount, reason } = body

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find recipient by phone number
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_number', recipientPhone)
      .single()

    if (!recipientProfile) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Create payment request
    const { data: paymentRequest, error } = await supabase
      .from('payment_requests')
      .insert({
        from_user_id: recipientProfile.id,
        to_user_id: user.id,
        amount,
        reason,
        status: 'pending',
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
