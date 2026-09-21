import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_ID } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan } = await req.json();

    // 1. BARREIRA REMOVIDA: Já não bloqueamos se não houver userId.
    // O sistema permite a passagem de visitantes para o Stripe.

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

    // 2. METADADOS SEGUROS: Se for visitante, marcamos temporariamente como 'guest_user'
    // para evitar falhas na base de dados e nos webhooks do Stripe.
    const safeUserId = userId || 'guest_user';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // O Apple Pay/Google Pay está incluído automaticamente aqui
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      
      // 3. O FLUXO DE OURO: Reencaminha diretamente para a página de registo após o pagamento.
      // O Stripe substituirá o {CHECKOUT_SESSION_ID} pelo código real da transação.
      success_url: `${req.headers.get('origin')}/login?session_id={CHECKOUT_SESSION_ID}`, 
      cancel_url: `${req.headers.get('origin')}/`, 
      
      customer_email: email || undefined,
      metadata: {
        userId: safeUserId,
      },
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          userId: safeUserId,
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