import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// 👇 CHAVE MESTRA: Usamos a chave Admin para furar o escudo e ler os perfis
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REMETENTE_OFICIAL = 'PrimalBase <suporte@primalbase.com.br>';

export async function GET(request: Request) {
  // 1. A BARREIRA DE SEGURANÇA DA VERCEL
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Acesso Negado: Área Restrita do QG', { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // 2. Puxa os recrutas FREE usando o supabaseAdmin
    const { data: recrutas, error } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, created_at, is_subscriber')
      .eq('is_subscriber', false)
      .not('email', 'is', null)
      .not('created_at', 'is', null);

    if (error || !recrutas) {
      return NextResponse.json({ erro: 'Nenhum recruta free encontrado.' });
    }

    const hoje = new Date();
    let disparos = 0;

    // 3. Verifica a "idade" da conta de cada um
    for (const recruta of recrutas) {
      const dataCadastro = new Date(recruta.created_at);
      const diferencaTempo = Math.abs(hoje.getTime() - dataCadastro.getTime());
      const diasNaBase = Math.floor(diferencaTempo / (1000 * 60 * 60 * 24));

      let assunto = '';
      let titulo = '';
      let mensagem = '';
      let cta = '';

      if (diasNaBase === 1) {
        assunto = 'O seu QG está operando com 10% da capacidade.';
        titulo = 'Destrave o seu arsenal';
        mensagem = `Comandante <strong>${recruta.full_name}</strong>, vi que você entrou na matilha, mas o seu Chef Criativo e o Especialista IA continuam trancados. Tentar dominar a sua biologia no "achismo" é pedir para falhar. Você tem 3 dias de acesso Premium totalmente gratuitos te esperando.`;
        cta = 'Ativar 3 Dias Grátis Agora';
      } 
      else if (diasNaBase === 3) {
        assunto = 'Vai continuar jogando no modo difícil?';
        titulo = 'Pare de dificultar o processo';
        mensagem = `<strong>${recruta.full_name}</strong>, você está há 3 dias na base. Enquanto você perde tempo tentando calcular macros ou adivinhar o que comer no fim do jejum, os Lobos Alfas estão usando o nosso Scanner e o Chef IA para derreter gordura no automático.`;
        cta = 'Deixar a IA trabalhar por mim';
      } 
      else if (diasNaBase === 15) {
        assunto = 'O seu passe livre de 3 dias vai ser cancelado.';
        titulo = 'Última Chamada';
        mensagem = `Esta é a última chamada, <strong>${recruta.full_name}</strong>. O sistema vai revogar a sua oferta de 3 dias de acesso ilimitado em 24 horas. Se você quer continuar usando apenas a casca do aplicativo e tendo resultados medianos, ignore este e-mail. Se quiser plugar a sua rotina no motor da PrimalBase, o momento é agora.`;
        cta = 'Destravar QG Premium Agora';
      }

      // 4. Atira APENAS O E-MAIL se for o dia exato
      if (assunto !== '') {
        await resend.emails.send({
          from: REMETENTE_OFICIAL,
          to: recruta.email,
          subject: assunto,
          html: `
          <div style="font-family: Arial, sans-serif; background-color: #09090b; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #111111; padding: 25px; border-bottom: 1px solid #27272a;">
                <h1 style="color: #f59e0b; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase;">PrimalBase</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #f4f4f5; margin-top: 0;">${titulo}</h2>
                <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 35px;">${mensagem}</p>
                <a href="https://primalbase.com.br" style="display: inline-block; background-color: #f59e0b; color: #000000; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase;">${cta}</a>
              </div>
            </div>
          </div>`
        });
        disparos++;
      }
    }

    return NextResponse.json({ sucesso: true, emails_disparados: disparos });
    
  } catch (error) {
    console.error('Erro na máquina de conversão:', error);
    return NextResponse.json({ erro: 'Falha na operação' }, { status: 500 });
  }
}