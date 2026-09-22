import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_ID } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan } = await req.json();

    if (!stripe || !STRIPE_PRICE_ID) {
      return NextResponse.json(
        { error: 'Stripe não está configurado. Verifique as variáveis de ambiente.' },
        { status: 500 }
      );
    }

    let selectedPriceId = STRIPE_PRICE_ID; 

    if (plan === 'anual') {
      selectedPriceId = 'price_1U9p33Cf4oilBdJA7fwtkoeL';
    } else if (plan === 'semestral') {
      selectedPriceId = 'price_1U9ovJCf4oilBdJAwsmy1Hnf';
    }

    // 👇 ROTEAMENTO INTELIGENTE DE UX
    // Se tem userId (já é cadastrado), vai pra Home ver confetes.
    // Se NÃO tem userId (Visitante), vai pro Onboarding VIP criar o perfil.
    const successUrl = userId
      ? `${req.headers.get('origin')}/?success=true&session_id={CHECKOUT_SESSION_ID}`
      : `${req.headers.get('origin')}/finalizar-cadastro?session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl, 
      cancel_url: `${req.headers.get('origin')}/`,
      customer_email: email || undefined,
      metadata: {
        userId: userId || '', 
      },
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          userId: userId || '',
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