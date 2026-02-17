import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

// Webhook secret (você precisa configurar no Stripe Dashboard)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe não está configurado' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  // Processar eventos do Stripe
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // userId vindo do metadata da sessão de checkout
        const userId =
          (session.metadata && (session.metadata as any).userId) ||
          (session.client_reference_id as string | null);

        if (!userId) {
          console.error('No userId in checkout.session.completed metadata');
          break;
        }

        try {
          // Buscar a assinatura criada a partir da sessão
          const subscriptionId = session.subscription as string | null;

          if (subscriptionId) {
            const subscription = (await stripe.subscriptions.retrieve(
              subscriptionId
            )) as Stripe.Subscription;

            const isActive = ['active', 'trialing'].includes(
              subscription.status
            );

            // Atualizar perfil do usuário para assinante
            await supabase
              .from('profiles')
              .update({ is_subscriber: isActive })
              .eq('id', userId);

            // Salvar/atualizar dados da assinatura
            await supabase
              .from('stripe_subscriptions')
              .upsert(
                {
                  user_id: userId,
                  stripe_customer_id: subscription.customer as string,
                  stripe_subscription_id: subscription.id,
                  status: subscription.status,
                  current_period_end: new Date(
                    ((subscription as any).current_period_end as number) * 1000
                  ).toISOString(),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
              );

            console.log(
              `✅ checkout.session.completed processed for user ${userId}`
            );
          } else {
            // Caso extremo: não há subscription ainda, mas já marcamos o usuário como assinante
            await supabase
              .from('profiles')
              .update({ is_subscriber: true })
              .eq('id', userId);

            console.log(
              `✅ checkout.session.completed without subscriptionId for user ${userId}`
            );
          }
        } catch (error: any) {
          console.error(
            'Error processing checkout.session.completed:',
            error?.message || error
          );
        }

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any; // FORÇANDO ANY AQUI
        const userId = subscription.metadata.userId;

        if (!userId) {
          console.error('No userId in subscription metadata');
          break;
        }

        // Verificar se a assinatura está ativa ou em trial
        const isActive = ['active', 'trialing'].includes(subscription.status);

        // Atualizar is_subscriber no perfil
        await supabase
          .from('profiles')
          .update({ is_subscriber: isActive })
          .eq('id', userId);

        // Salvar/atualizar dados da assinatura
        await supabase
          .from('stripe_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        console.log(`✅ Subscription ${subscription.status} for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (!userId) {
          console.error('No userId in subscription metadata');
          break;
        }

        // Remover status de assinante
        await supabase
          .from('profiles')
          .update({ is_subscriber: false })
          .eq('id', userId);

        // Atualizar status da assinatura
        await supabase
          .from('stripe_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        console.log(`❌ Subscription canceled for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = (invoice as any).subscription;

        if (subscription && typeof subscription === 'string') {
          const sub = (await stripe.subscriptions.retrieve(subscription)) as Stripe.Subscription;
          const userId = sub.metadata.userId;

          if (userId) {
            // Remover status de assinante em caso de falha de pagamento
            await supabase
              .from('profiles')
              .update({ is_subscriber: false })
              .eq('id', userId);

            console.log(`⚠️ Payment failed for user ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
