import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; 
import { Resend } from 'resend';
import { dispararPush } from '@/lib/push-commander';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const REMETENTE_OFICIAL = 'Primal Base <suporte@primalbase.com.br>'; 

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Acesso Negado: Área Restrita do Servidor', { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
    return NextResponse.json({ error: 'Faltam chaves de integração no servidor.' }, { status: 500 });
  }

  try {
    const tresDiasAtras = new Date();
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

    // Inclusão do full_name para extração do primeiro nome dinamicamente
    const { data: usuarios, error } = await supabaseAdmin
      .from('profiles')
      .select('id, onesignal_id, updated_at, email, full_name') 
      .not('onesignal_id', 'is', null)
      .lt('updated_at', tresDiasAtras.toISOString());

    if (error || !usuarios || usuarios.length === 0) {
      return NextResponse.json({ message: 'Nenhum usuário inativo hoje. A base está ativa.' });
    }

    const inativosDia3: any[] = [];
    const inativosDia7: any[] = [];
    const inativosDia15: any[] = [];
    const inativosDia30: any[] = [];
    const idsParaDescartar: string[] = []; 

    const hoje = new Date();

    usuarios.forEach((u: any) => {
      if (!u.updated_at) return;
      
      const dataUltimoAcesso = new Date(u.updated_at);
      const diffTempo = hoje.getTime() - dataUltimoAcesso.getTime();
      const diasSumido = Math.floor(diffTempo / (1000 * 3600 * 24));

      const nome = u.full_name?.split(' ')[0] || 'Usuário';
      const alvo = { id: u.id, onesignal: u.onesignal_id, email: u.email, nome };

      if (diasSumido === 3) inativosDia3.push(alvo);
      else if (diasSumido === 7) inativosDia7.push(alvo);
      else if (diasSumido === 15) inativosDia15.push(alvo);
      else if (diasSumido >= 30) { 
        inativosDia30.push(alvo);
        idsParaDescartar.push(u.id); 
      }
    });

    // Função refatorada para permitir títulos e e-mails personalizados com o nome do usuário
    const processarAlertas = async (
      alvos: any[], 
      gerarTituloPush: (nome: string) => string, 
      gerarMsgPush: (nome: string) => string, 
      gerarAssuntoEmail: (nome: string) => string, 
      gerarCorpoEmail: (nome: string) => string, 
      nomeRobo: string
    ) => {
      if (alvos.length === 0) return; 
      
      const promessas = alvos.map(async (alvo) => {
        const promessasIndividuais = [];
        
        if (alvo.onesignal) {
          promessasIndividuais.push(
            dispararPush([alvo.onesignal], gerarTituloPush(alvo.nome), gerarMsgPush(alvo.nome), nomeRobo)
          );
        }

        if (alvo.email) {
          promessasIndividuais.push(
            resend.emails.send({
              from: REMETENTE_OFICIAL,
              to: alvo.email,
              subject: gerarAssuntoEmail(alvo.nome),
              html: gerarCorpoEmail(alvo.nome)
            })
          );
        }
        
        await Promise.all(promessasIndividuais).catch(err => console.error('Erro de envio para:', alvo.email, err));
      });

      await Promise.all(promessas);
    };

    // Template centralizado para enxugar o código e facilitar manutenção visual
    const templateEmail = (titulo: string, mensagem: string, ctaHtml: string) => `
    <!DOCTYPE html>
    <html lang="pt-BR" style="color-scheme: dark;">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="background-color: #0A0A0A; margin: 0; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border: 1px solid #27272A; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #111111; padding: 25px; text-align: center; border-bottom: 1px solid #27272A;">
          <h1 style="color: #F97316; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Primal Base</h1>
        </div>
        <div style="padding: 40px 30px; text-align: left; background-color: #0A0A0A;">
          <h2 style="color: #F4F4F5; margin-top: 0; font-size: 22px; font-weight: 600; text-align: center;">${titulo}</h2>
          <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 35px;">${mensagem}</p>
          ${ctaHtml}
        </div>
        <div style="padding: 20px; text-align: center; background-color: #111111; border-top: 1px solid #27272A;">
          <p style="color: #52525B; font-size: 12px; margin: 0;">© 2026 Primal Base. Disciplina é rotina.</p>
        </div>
      </div>
    </body>
    </html>`;

    // Processamento do Funil (DIA 3)
    await processarAlertas(
      inativosDia3, 
      () => "O cansaço mental voltou a ditar suas escolhas? ⚡", 
      () => "Deixe o Chef Primal resolver seu jantar em segundos.",
      () => "A fadiga de decisão está sabotando sua semana. ⚡",
      (nome) => templateEmail(
        "A fadiga de decisão está sabotando sua semana.",
        `Fala <strong>${nome}</strong>, notamos 3 dias sem acesso ao Primal Base. Esse é o exato momento em que o cansaço do dia a dia ataca e os aplicativos de delivery começam a parecer a única opção viável.<br><br>Não gaste sua energia mental tentando adivinhar o que comer. Abra o aplicativo agora, diga o que tem na geladeira e deixe o Chef Primal montar um prato de alta performance para você.`,
        `<div style="text-align: center;"><a href="https://primalbase.com.br" style="display: inline-block; background-color: #F97316; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Gerar Refeição Rápida</a></div>`
      ),
      'FUNIL RETENÇÃO (DIA 3)' 
    );
    
    // Processamento do Funil (DIA 7)
    await processarAlertas(
      inativosDia7, 
      (nome) => `A indústria alimentícia agradece sua ausência, ${nome}. 🛡️`, 
      () => "Retome o controle antes de perder os resultados.",
      () => "7 dias no escuro nutricional. 🛡️",
      (nome) => templateEmail(
        "7 dias no escuro nutricional.",
        `Fala <strong>${nome}</strong>, uma semana longe do Primal Base significa uma semana inteira tomando decisões nutricionais no instinto.<br><br>É exatamente assim que os ultraprocessados e a inflamação voltam de forma silenciosa para a sua rotina. Não jogue fora o processo de adaptação do seu corpo. Use o Scanner e o Especialista IA para blindar suas escolhas e retomar o Protocolo Ancestral.`,
        `<div style="text-align: center;"><a href="https://primalbase.com.br" style="display: inline-block; background-color: #F97316; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Retomar a Alta Performance</a></div>`
      ),
      'FUNIL RETENÇÃO (DIA 7)' 
    );
    
    // Processamento do Funil (DIA 15)
    await processarAlertas(
      inativosDia15, 
      () => "Sua logística nutricional está estagnada. ⚡", 
      () => "O app já tem a lista de compras da sua próxima semana.",
      () => "Pare de gastar horas organizando a sua dieta. ⚡",
      (nome) => templateEmail(
        "Pare de gastar horas organizando a sua dieta.",
        `Fala <strong>${nome}</strong>, tentar organizar compras, ler rótulos minúsculos e estruturar cardápios por conta própria drena seu foco e consome um tempo que você não tem.<br><br>Você está há 15 dias sem usar a inteligência do sistema a seu favor. Você não precisa recomeçar do zero. Acesse o aplicativo, gere seu Cardápio Semanal com um clique e exporte sua Lista de Compras automatizada. Deixe o trabalho duro com o sistema.`,
        `<div style="text-align: center;"><a href="https://primalbase.com.br" style="display: inline-block; background-color: #F97316; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Planejar Minha Semana</a></div>`
      ),
      'FUNIL RETENÇÃO (DIA 15)' 
    );
    
    // Processamento do Funil (DIA 30)
    await processarAlertas(
      inativosDia30, 
      () => "Automações em repouso. 🛡️", 
      () => "Pausamos seus alertas diários. O ecossistema aguarda seu retorno.",
      () => "Seus alertas diários foram pausados. 🛡️",
      (nome) => templateEmail(
        "Status: Inativo",
        `Fala <strong>${nome}</strong>, como registramos 30 dias de inatividade, estamos pausando temporariamente seus alertas diários do Primal Base para manter a tela do seu celular limpa.<br><br>Sabemos que a névoa mental e o cansaço cobram um preço alto quando deixamos a nutrição no piloto automático da indústria moderna. Quando você estiver pronto para retomar a clareza mental e terceirizar a organização do seu Protocolo Ancestral, todas as suas ferramentas estarão aqui esperando por você.`,
        ``
      ),
      'FUNIL RETENÇÃO (DIA 30)' 
    );

    // Desligamento de usuários inativos (Evita marcação de Spam)
    if (idsParaDescartar.length > 0) {
      await supabaseAdmin
        .from('profiles')
        .update({ onesignal_id: null }) 
        .in('id', idsParaDescartar);
    }

    return NextResponse.json({ 
      success: true, 
      relatorio: {
        dia3: inativosDia3.length,
        dia7: inativosDia7.length,
        dia15: inativosDia15.length,
        dia30: inativosDia30.length,
        inativados: idsParaDescartar.length
      }
    });

  } catch (err) {
    console.error('Erro no funil de resgate:', err);
    return NextResponse.json({ error: 'Falha no processamento do funil.' }, { status: 500 });
  }
}