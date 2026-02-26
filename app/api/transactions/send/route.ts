import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { recipientPhone, amount, message } = body

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
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_number', recipientPhone)
      .single()

    if (recipientError || !recipientProfile) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Get sender's wallet
    const { data: senderWallet, error: senderWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (senderWalletError || !senderWallet) {
      return NextResponse.json(
        { error: 'Sender wallet not found' },
        { status: 404 }
      )
    }

    // Check balance
    if (senderWallet.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Get recipient's wallet
    const { data: recipientWallet, error: recipientWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', recipientProfile.id)
      .single()

    if (recipientWalletError || !recipientWallet) {
      return NextResponse.json(
        { error: 'Recipient wallet not found' },
        { status: 404 }
      )
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: senderWallet.id,
        from_user_id: user.id,
        to_user_id: recipientProfile.id,
        type: 'transfer_out',
        amount,
        description: message,
        status: 'completed',
      })

    if (transactionError) {
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      )
    }

    // Create receive transaction for recipient
    await supabase
      .from('transactions')
      .insert({
        wallet_id: recipientWallet.id,
        from_user_id: user.id,
        to_user_id: recipientProfile.id,
        type: 'transfer_in',
        amount,
        description: message,
        status: 'completed',
      })

    // Update balances
    await supabase
      .from('wallets')
      .update({ balance: senderWallet.balance - amount })
      .eq('id', senderWallet.id)

    await supabase
      .from('wallets')
      .update({ balance: recipientWallet.balance + amount })
      .eq('id', recipientWallet.id)

    return NextResponse.json({
      success: true,
      message: 'Money sent successfully',
    })
  } catch (error) {
    console.error('Send money error:', error)
    return NextResponse.json(
      { error: 'Failed to send money' },
      { status: 500 }
    )
  }
}
