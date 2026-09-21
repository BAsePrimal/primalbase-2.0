import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userId } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 👇 Correção 1 e 2: Trava de segurança para o TypeScript saber que o Stripe não é 'null'
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe não configurado no servidor' }, { status: 500 });
    }

    // 1. Busca a compra lá no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || !session.subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    const subscriptionId = session.subscription as string;

    // 2. Avisa o Stripe de quem é o dono! (Isso garante que renovações futuras funcionem)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      metadata: { userId },
    });

    // 3. Usa o modo Admin para liberar o acesso VIP no banco de dados imediatamente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Torna o perfil VIP
    await supabaseAdmin.from('profiles').update({ is_subscriber: true }).eq('id', userId);

    // 👇 Correção 3: Usamos "(subscription as any)" para o TypeScript não reclamar da tipagem
    const currentPeriodEnd = (subscription as any).current_period_end;
    const safeCurrentPeriodEnd = new Date(currentPeriodEnd * 1000).toISOString();

    // Cria/Atualiza a tabela de assinaturas para o Paywall saber que está pago
    await supabaseAdmin.from('stripe_subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: (subscription as any).customer as string,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: safeCurrentPeriodEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao vincular assinatura:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}