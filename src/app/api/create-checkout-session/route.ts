import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_ID } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!stripe || !STRIPE_PRICE_ID) {
      return NextResponse.json(
        { error: 'Stripe não está configurado. Verifique as variáveis de ambiente.' },
        { status: 500 }
      );
    }

    // Criar sessão de checkout com trial de 3 dias
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/perfil?success=true`,
      cancel_url: `${req.headers.get('origin')}/perfil?canceled=true`,
      customer_email: email || undefined,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          userId: userId,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar sessão de checkout' },
      { status: 500 }
    );
  }
}
