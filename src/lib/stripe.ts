import Stripe from 'stripe';

// Usar variáveis de ambiente em vez de chaves hardcoded
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
const stripePriceId = process.env.STRIPE_PRICE_ID;

export const STRIPE_SECRET_KEY = stripeSecretKey || '';
export const STRIPE_PUBLIC_KEY = stripePublicKey || '';
export const STRIPE_PRICE_ID = stripePriceId || '';

// Inicializar Stripe apenas se a chave secreta existir
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    })
  : null;
