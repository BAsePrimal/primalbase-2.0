import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// LIGANDO O STRIPE DIRETO NA TOMADA PARA EVITAR O ERRO DA PASTA
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Buscar o ID do cliente da Stripe no Supabase
    const { data: subscription, error } = await supabaseAdmin
      .from('stripe_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (error || !subscription || !subscription.stripe_customer_id) {
      console.error('Erro ao buscar cliente da Stripe:', error);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Criar a sessão do portal da Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/perfil`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao criar portal session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}