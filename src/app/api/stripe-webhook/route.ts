import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : (null as any);

async function acionarCaixaPreta(userId: string, erroDetalhado: any) {
  try {
    const { logError } = await import('@/lib/logger');
    const mensagemErro = `Falha Crítica no Pagamento. Erro no banco de dados ao tentar atualizar o status VIP do usuário. Erro: ${erroDetalhado?.message || JSON.stringify(erroDetalhado)}`;
    await logError('Stripe Webhook (Pagamento)', mensagemErro, `Guerreiro ID: ${userId}`);
    console.log("🚨 Pane registrada na Caixa Preta com sucesso!");
  } catch (err) {
    console.error("Falha dupla: O logger oficial não conseguiu registrar o erro.", err);
  }
}

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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId =
          (session.metadata && (session.metadata as any).userId) ||
          (session.client_reference_id as string | null);

        // 👇 A MÁGICA: Se não houver ID (visitante), o webhook apenas observa e não dá erro.
        if (!userId || userId === '') {
          console.log('🛒 [Visitante] Compra aprovada! O cliente vai criar a conta agora com o session_id.');
          break; 
        }

        try {
          const subscriptionId = session.subscription as string | null;

          if (subscriptionId) {
            const subscription = (await stripe.subscriptions.retrieve(
              subscriptionId
            )) as Stripe.Subscription;

            const isActive = ['active', 'trialing'].includes(
              subscription.status
            );

            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .update({ is_subscriber: isActive })
              .eq('id', userId);

            if (profileError) {
              await acionarCaixaPreta(userId, profileError);
            }

            const currentPeriodEnd = (subscription as any).current_period_end;
            const safeCurrentPeriodEnd = currentPeriodEnd && typeof currentPeriodEnd === 'number' && !isNaN(currentPeriodEnd)
              ? new Date(currentPeriodEnd * 1000).toISOString()
              : new Date().toISOString();

            const { error: subError } = await supabaseAdmin
              .from('stripe_subscriptions')
              .upsert(
                {
                  user_id: userId,
                  stripe_customer_id: subscription.customer as string,
                  stripe_subscription_id: subscription.id,
                  status: subscription.status,
                  current_period_end: safeCurrentPeriodEnd,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
              );

            if (subError) {
              await acionarCaixaPreta(userId, subError);
            }

            console.log(
              `✅ checkout.session.completed processed for user ${userId}`
            );
          } else {
            const { error: noSubProfileError } = await supabaseAdmin
              .from('profiles')
              .update({ is_subscriber: true })
              .eq('id', userId);

            if (noSubProfileError) {
              await acionarCaixaPreta(userId, noSubProfileError);
            }

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
        const subscription = event.data.object as any; 
        const userId = subscription.metadata?.userId;

        // 👇 A MÁGICA: Ignora atualizações de visitantes até que o registo seja concluído.
        if (!userId || userId === '') {
          console.log(`🛒 [Visitante] Assinatura ${subscription.status} atualizada no Stripe. A aguardar registo no ecrã de login.`);
          break;
        }

        const isActive = ['active', 'trialing'].includes(subscription.status);

        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({ is_subscriber: isActive })
          .eq('id', userId);

        if (updateProfileError) {
          await acionarCaixaPreta(userId, updateProfileError);
        }

        const currentPeriodEnd = subscription.current_period_end;
        const safeCurrentPeriodEnd = currentPeriodEnd && typeof currentPeriodEnd === 'number' && !isNaN(currentPeriodEnd)
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : new Date().toISOString();

        const { error: updateSubError } = await supabaseAdmin
          .from('stripe_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_end: safeCurrentPeriodEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (updateSubError) {
          await acionarCaixaPreta(userId, updateSubError);
        }

        console.log(`✅ Subscription ${subscription.status} for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;

        if (!stripeCustomerId) {
          console.error('No customer ID in subscription');
          break;
        }

        const { data: row } = await supabaseAdmin
          .from('stripe_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', stripeCustomerId)
          .maybeSingle();

        const userId = row?.user_id;
        if (!userId) {
          console.error(
            `No user_id in stripe_subscriptions for customer ${stripeCustomerId}`
          );
          break;
        }

        await supabaseAdmin
          .from('profiles')
          .update({ is_subscriber: false })
          .eq('id', userId);

        await supabaseAdmin
          .from('stripe_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', stripeCustomerId);

        console.log(`❌ Subscription canceled for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : (invoice.customer as any)?.id;

        if (!stripeCustomerId) {
          console.error('No customer ID in invoice');
          break;
        }

        const { data: row } = await supabaseAdmin
          .from('stripe_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', stripeCustomerId)
          .maybeSingle();

        const userId = row?.user_id;
        if (!userId) {
          console.error(
            `No user_id in stripe_subscriptions for customer ${stripeCustomerId}`
          );
          break;
        }

        await supabaseAdmin
          .from('profiles')
          .update({ is_subscriber: false })
          .eq('id', userId);

        await supabaseAdmin
          .from('stripe_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', stripeCustomerId);

        console.log(`⚠️ Payment failed for user ${userId}`);
        
        try {
          const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .maybeSingle();

          if (profileData?.email) {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);

            await resend.emails.send({
              from: 'Primal Base <suporte@primalbase.com.br>',
              to: profileData.email,
              subject: '⚠️ Pagamento Recusado - Acesso ao Protocolo Pausado',
              html: `
                <div style="font-family: sans-serif; padding: 20px; background-color: #18181b; color: #f4f4f5; text-align: center; border-radius: 8px; border: 1px solid #27272a;">
                  <h2 style="color: #ef4444; text-transform: uppercase; letter-spacing: 1px;">Acesso Premium Pausado</h2>
                  <p style="font-size: 16px; color: #d4d4d8;">O seu cartão de crédito foi recusado no processamento do último ciclo.</p>
                  <p style="font-size: 16px; color: #d4d4d8;">Seu acesso às jornadas do Protocolo Ancestral foi bloqueado temporariamente.</p>
                  <p style="font-size: 16px; color: #a1a1aa; margin-bottom: 25px;">Atualize sua forma de pagamento para restaurar seu progresso imediatamente.</p>
                  <a href="https://primalbase.com.br/perfil" style="display: inline-block; padding: 14px 28px; background-color: #ef4444; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Atualizar Pagamento</a>
                </div>
              `
            });
            console.log(`📧 Aviso de falha enviado com sucesso para: ${profileData.email}`);
          }
        } catch (emailErr) {
          console.error('Falha ao tentar enviar e-mail de cobrança. O sistema segue normal:', emailErr);
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