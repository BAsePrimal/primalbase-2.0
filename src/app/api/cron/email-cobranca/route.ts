import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { stripe } from '@/lib/stripe'; 

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const REMETENTE_OFICIAL = 'Primal Base <suporte@primalbase.com.br>';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Acesso Negado: Área Restrita do Servidor', { status: 401 });
  }

  try {
    const { data: assinaturas, error: erroSubs } = await supabaseAdmin
      .from('stripe_subscriptions')
      .select('user_id, current_period_end, stripe_subscription_id')
      .eq('status', 'trialing');

    if (erroSubs || !assinaturas || assinaturas.length === 0) {
      return NextResponse.json({ message: 'Nenhuma assinatura em período de teste no momento.' });
    }

    const alvosIds = assinaturas.map(sub => sub.user_id);

    const { data: usuarios, error: erroProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', alvosIds)
      .not('email', 'is', null);

    if (erroProfiles || !usuarios) {
      return NextResponse.json({ erro: 'Falha ao cruzar dados de perfis.' });
    }

    let disparos = 0;
    const hoje = new Date();

    for (const sub of assinaturas) {
      const usuario = usuarios.find(u => u.id === sub.user_id);
      if (!usuario || !sub.current_period_end || !sub.stripe_subscription_id) continue;

      const dataFim = new Date(sub.current_period_end);
      const horasRestantes = (dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60);

      if (horasRestantes > 24 && horasRestantes <= 48) {
        
        let nomeDoPlano = 'Plano Premium';
        let valorDoPlano = 'R$ 29,90';

        // Consulta dinâmica ao Stripe com trava de segurança anti-null
        try {
          if (stripe) {
            const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
            const price = stripeSub.items.data[0].price;
            
            if (price && price.unit_amount) {
              const valorFormatado = (price.unit_amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              valorDoPlano = valorFormatado;
              
              if (price.recurring?.interval === 'month') {
                nomeDoPlano = price.recurring.interval_count === 6 ? 'Plano Semestral' : 'Plano Mensal';
              } else if (price.recurring?.interval === 'year') {
                nomeDoPlano = 'Plano Anual';
              }
            }
          }
        } catch (stripeError) {
          console.error('Erro ao buscar dados do plano no Stripe:', stripeError);
        }

        const nome = usuario.full_name?.split(' ')[0] || 'Usuário';

        await resend.emails.send({
          from: REMETENTE_OFICIAL,
          to: usuario.email,
          subject: 'O seu período de teste no Primal Base encerra amanhã.',
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #09090b; padding: 40px 20px; text-align: center;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; text-align: left;">
                <div style="background-color: #111111; padding: 25px; border-bottom: 1px solid #27272a; text-align: center;">
                  <h1 style="color: #f59e0b; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase;">Primal Base</h1>
                </div>
                <div style="padding: 40px 30px;">
                  <h2 style="color: #f4f4f5; margin-top: 0; text-align: center;">Transição para o plano Premium.</h2>
                  <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">Fala <strong>${nome}</strong>,</p>
                  <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">O seu período de teste gratuito do Primal Base será concluído em 24 horas.</p>
                  <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">Durante esses dias, você experimentou como é prático não ter que quebrar a cabeça para planejar sua alimentação. O objetivo do plano Premium é exatamente esse: tirar a fadiga de decisão das suas costas. Em vez de gastar horas organizando a semana, você tem o Chef Primal, o Scanner, o Gerador de Cardápios Semanal, a Lista de Compras automatizada e o Especialista IA à sua disposição. É um ecossistema completo para você seguir o Protocolo Ancestral no piloto automático, sem perder tempo no supermercado ou na cozinha.</p>
                  <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">Sua assinatura do <strong>${nomeDoPlano}</strong> no valor de <strong>${valorDoPlano}</strong> será processada automaticamente amanhã. Manter a Inteligência do aplicativo organizando a sua rotina custa muito menos do que o desperdício financeiro de comprar alimentos inflamatórios por impulso.</p>
                  <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">Se você quer manter todas as ferramentas ativas, não é necessário fazer nada. O sistema cuidará da renovação.</p>
                  <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">Caso prefira cancelar o acesso antes da cobrança, basta acessar as configurações do seu perfil direto no aplicativo.</p>
                  <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-top: 30px;">Seguimos no foco,<br><strong style="color: #f4f4f5;">Equipe Primal Base</strong></p>
                </div>
              </div>
            </div>
          `
        });
        disparos++;
      }
    }

    return NextResponse.json({ sucesso: true, alvos_atingidos: disparos });
  } catch (error) {
    console.error('Erro no robô de transição do trial:', error);
    return NextResponse.json({ error: 'Falha no sistema.' }, { status: 500 });
  }
}