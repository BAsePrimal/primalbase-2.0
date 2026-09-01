import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REMETENTE_OFICIAL = 'Primal Base <suporte@primalbase.com.br>';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Acesso Negado: Área Restrita do Servidor', { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data: usuarios, error } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, created_at, is_subscriber')
      .eq('is_subscriber', false)
      .not('email', 'is', null)
      .not('created_at', 'is', null);

    if (error || !usuarios) {
      return NextResponse.json({ erro: 'Nenhum usuário gratuito encontrado.' });
    }

    const hoje = new Date();
    let disparos = 0;

    for (const usuario of usuarios) {
      const dataCadastro = new Date(usuario.created_at);
      const diferencaTempo = Math.abs(hoje.getTime() - dataCadastro.getTime());
      const diasNaBase = Math.floor(diferencaTempo / (1000 * 60 * 60 * 24));

      let assunto = '';
      let titulo = '';
      let mensagem = '';
      let cta = '';
      
      const nome = usuario.full_name?.split(' ')[0] || 'Guerreiro';

      if (diasNaBase === 1) {
        assunto = `O Protocolo não funciona pela metade, ${nome}.`;
        titulo = 'Suas principais ferramentas estão bloqueadas';
        mensagem = `Fala <strong>${nome}</strong>, vi que você criou sua conta, mas o Chef Primal e o Leitor de Rótulos continuam bloqueados. Tentar adivinhar o que comer ou como montar os pratos no dia a dia é o que faz a maioria das pessoas desistir na primeira semana. Nossas ferramentas resolvem isso na hora, entregando a refeição certa com o que você já tem na geladeira. Libere seus 3 dias grátis agora e veja a diferença de ter o aplicativo fazendo o trabalho duro por você.`;
        cta = 'Ativar 3 Dias Grátis';
      } 
      else if (diasNaBase === 3) {
        assunto = 'O falso saudável que trava seus resultados';
        titulo = 'Pare de cair nas armadilhas do mercado';
        mensagem = `Fala <strong>${nome}</strong>, a indústria coloca embalagens verdes e a palavra "Fit" em produtos que são puro açúcar e óleo inflamatório. Você pode passar horas no mercado tentando ler letrinhas para descobrir o que é ruim, ou pode simplesmente usar o Scanner do Primal Base. Você aponta a câmera, e o aplicativo te diz na mesma hora se aquilo serve para o Protocolo Ancestral ou se vai travar sua queima de gordura. Simples assim.`;
        cta = 'Destravar o Scanner Primal';
      } 
      else if (diasNaBase === 15) {
        assunto = 'Seus 3 dias grátis expiram amanhã.';
        titulo = `Último aviso, ${nome}`;
        mensagem = `Fala <strong>${nome}</strong>, o sistema vai encerrar o seu convite para os 3 dias grátis em 24 horas. Continuar no plano gratuito significa voltar a quebrar a cabeça para montar refeições e correr o risco de comprar alimentos que inflamam seu corpo. Se você quer o aplicativo guiando seu Protocolo Ancestral passo a passo todos os dias, essa é a última chance de testar as ferramentas premium sem pagar nada.`;
        cta = 'Ativar Ferramentas Premium';
      }

      if (assunto !== '') {
        await resend.emails.send({
          from: REMETENTE_OFICIAL,
          to: usuario.email,
          subject: assunto,
          html: `
          <div style="font-family: Arial, sans-serif; background-color: #09090b; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #111111; padding: 25px; border-bottom: 1px solid #27272a;">
                <h1 style="color: #f59e0b; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase;">Primal Base</h1>
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