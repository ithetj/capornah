import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { plan, scanId } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Determine which price to use
    const priceId = plan === 'monthly'
      ? process.env.STRIPE_PRICE_ID_MONTHLY!
      : process.env.STRIPE_PRICE_ID_ONETIME!;

    const mode = plan === 'monthly' ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/result/${scanId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/result/${scanId}?canceled=true`,
      metadata: {
        user_id: user.id,
        scan_id: scanId,
        plan: plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}