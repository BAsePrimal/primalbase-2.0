import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Injeção da Chave Mestra do Banco de Dados
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  // Barreira de segurança para garantir que só a Vercel aperte o gatilho
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Acesso Negado: Área Restrita do QG', { status: 401 });
  }

  try {
    // 1. Puxa APENAS quem está com o cartão rodando o trial no Stripe
    const { data: assinaturas, error: erroSubs } = await supabaseAdmin
      .from('stripe_subscriptions')
      .select('user_id, current_period_end')
      .eq('status', 'trialing');

    if (erroSubs || !assinaturas || assinaturas.length === 0) {
      return NextResponse.json({ message: 'Nenhuma assinatura em período de teste no momento.' });
    }

    // Extrai os IDs dos guerreiros que estão no trial
    const alvosIds = assinaturas.map(sub => sub.user_id);

    // 2. Busca os dados (email e nome) desses guerreiros na tabela profiles
    const { data: recrutas, error: erroProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', alvosIds)
      .not('email', 'is', null);

    if (erroProfiles || !recrutas) {
      return NextResponse.json({ erro: 'Falha ao cruzar dados de perfis.' });
    }

    let disparos = 0;
    const hoje = new Date();

    // 3. A Matemática de Precisão
    for (const sub of assinaturas) {
      const recruta = recrutas.find(r => r.id === sub.user_id);
      if (!recruta || !sub.current_period_end) continue;

      const dataFim = new Date(sub.current_period_end);
      const horasRestantes = (dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60);

      // Se faltar entre 24h e 48h para a cobrança cair, ele atira.
      // Isso garante que ele mande EXATAMENTE 1 dia antes e nunca mande o e-mail duplicado.
      if (horasRestantes > 24 && horasRestantes <= 48) {
        
        await resend.emails.send({
          from: 'PrimalBase <suporte@primalbase.com.br>',
          to: recruta.email,
          subject: 'Aviso: Seu acesso Premium expira amanhã ⚠️',
          html: `
            <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5; max-width: 500px;">
              <h2 style="color: #E53E3E;">Aviso: Seu acesso Premium expira amanhã.</h2>
              <p>Fala ${recruta.full_name},</p>
              <p>Seu período de teste gratuito do PrimalBase termina em 24 horas. Amanhã, a sua proteção será desativada e o seu acesso ao <strong>Scanner de Rótulos</strong> e ao <strong>Chef IA</strong> será bloqueado.</p>
              <p>Não volte para a estaca zero, tentando ler letrinhas minúsculas no supermercado ou comendo lixo industrializado por falta de tempo.</p>
              <p>Sua assinatura de R$ 29,90 será processada automaticamente amanhã. Isso dá menos de <strong>R$ 1,00 por dia</strong> para você manter a nossa Inteligência Artificial no seu bolso e blindar a sua saúde e a da sua família contra a indústria.</p>
              <p>Se você quer continuar blindado e manter seu acesso, não precisa fazer nada. O sistema cuida de tudo.</p>
              <p>Se quiser cancelar antes da cobrança, é só acessar seu perfil no aplicativo.</p>
              <p>Seguimos no plano,</p>
              <p><strong>Equipe PrimalBase</strong></p>
            </div>
          `
        });
        disparos++;
      }
    }

    return NextResponse.json({ sucesso: true, alvos_atingidos: disparos });
  } catch (error) {
    console.error('Erro no robô de cobrança:', error);
    return NextResponse.json({ error: 'Falha no sistema.' }, { status: 500 });
  }
}