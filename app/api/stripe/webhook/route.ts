import { stripe } from '@/lib/stripe'
import { getServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      )
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any

      const serverClient = getServerClient()

      // Get user ID from metadata
      const userId = session.metadata?.userId
      if (!userId) {
        throw new Error('User ID not found in metadata')
      }

      // Get wallet
      const { data: wallet } = await serverClient
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!wallet) {
        throw new Error('Wallet not found')
      }

      // Calculate amount (Stripe uses cents)
      const amount = session.amount_total / 100

      // Update wallet balance
      await serverClient
        .from('wallets')
        .update({ balance: wallet.balance + amount })
        .eq('id', wallet.id)

      // Create transaction record
      await serverClient
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'topup',
          amount,
          description: 'Stripe Top-up',
          status: 'completed',
          stripe_payment_intent_id: session.payment_intent,
        })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    )
  }
}
