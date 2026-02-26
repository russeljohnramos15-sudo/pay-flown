import { supabase, getServerClient } from '@/lib/supabase'
import { sendMoneySchema } from '@/lib/validators'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = sendMoneySchema.parse(body)

    const serverClient = getServerClient()
    
    // Get current user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get sender's user ID from Supabase auth
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find recipient by phone number
    const { data: recipientProfile, error: recipientError } = await serverClient
      .from('profiles')
      .select('*')
      .eq('phone_number', validatedData.recipientPhone)
      .single()

    if (recipientError || !recipientProfile) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Get sender's wallet
    const { data: senderWallet, error: senderWalletError } = await serverClient
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
    if (senderWallet.balance < validatedData.amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Get recipient's wallet
    const { data: recipientWallet, error: recipientWalletError } = await serverClient
      .from('wallets')
      .select('*')
      .eq('user_id', recipientProfile.user_id)
      .single()

    if (recipientWalletError || !recipientWallet) {
      return NextResponse.json(
        { error: 'Recipient wallet not found' },
        { status: 404 }
      )
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await serverClient
      .from('transactions')
      .insert({
        wallet_id: senderWallet.id,
        type: 'send',
        amount: validatedData.amount,
        recipient_id: recipientProfile.user_id,
        description: validatedData.message,
        status: 'completed',
      })
      .select()
      .single()

    if (transactionError) {
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      )
    }

    // Create receive transaction for recipient
    await serverClient
      .from('transactions')
      .insert({
        wallet_id: recipientWallet.id,
        type: 'receive',
        amount: validatedData.amount,
        recipient_id: user.id,
        description: validatedData.message,
        status: 'completed',
      })

    // Update balances
    await serverClient
      .from('wallets')
      .update({ balance: senderWallet.balance - validatedData.amount })
      .eq('id', senderWallet.id)

    await serverClient
      .from('wallets')
      .update({ balance: recipientWallet.balance + validatedData.amount })
      .eq('id', recipientWallet.id)

    return NextResponse.json({
      success: true,
      transaction,
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
