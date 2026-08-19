import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // 👈 IMPORTAÇÃO NECESSÁRIA PARA A CHAVE MESTRA
import { Resend } from 'resend';
import { dispararPush } from '@/lib/push-commander';

// 👇 INJEÇÃO DA CHAVE MESTRA: Cria um cliente que ignora o RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Deixe apenas o texto do remetente aqui fora
const REMETENTE_OFICIAL = 'PrimalBase <suporte@primalbase.com.br>'; 

export async function GET(request: Request) {
  // 1. A BARREIRA DE SEGURANÇA DA VERCEL
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Acesso Negado: Área Restrita do QG', { status: 401 });
  }

  // 2. O Resend fica DENTRO da função GET
  const resend = new Resend(process.env.RESEND_API_KEY);

  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
    return NextResponse.json({ error: 'Faltam as chaves do arsenal.' }, { status: 500 });
  }

  try {
    const tresDiasAtras = new Date();
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

    // 👇 USANDO O SUPABASE ADMIN AQUI PARA FURAR O ESCUDO
    const { data: guerreiros, error } = await supabaseAdmin
      .from('profiles')
      .select('id, onesignal_id, updated_at, email') 
      .not('onesignal_id', 'is', null)
      .lt('updated_at', tresDiasAtras.toISOString());

    if (error || !guerreiros || guerreiros.length === 0) {
      return NextResponse.json({ message: 'Nenhum alvo no funil hoje. A matilha está ativa.' });
    }

    // 3. Os Baldes guardam o objeto completo (Push + E-mail)
    const alvosDia3: any[] = [];
    const alvosDia7: any[] = [];
    const alvosDia15: any[] = [];
    const alvosDia30: any[] = [];
    const idsParaDescartar: string[] = []; 

    const hoje = new Date();

    guerreiros.forEach((g: any) => {
      if (!g.updated_at) return;
      
      const dataUltimoAcesso = new Date(g.updated_at);
      const diffTempo = hoje.getTime() - dataUltimoAcesso.getTime();
      const diasSumido = Math.floor(diffTempo / (1000 * 3600 * 24));

      const alvo = { id: g.id, onesignal: g.onesignal_id, email: g.email };

      if (diasSumido === 3) alvosDia3.push(alvo);
      else if (diasSumido === 7) alvosDia7.push(alvo);
      else if (diasSumido === 15) alvosDia15.push(alvo);
      else if (diasSumido === 30) {
        alvosDia30.push(alvo);
        idsParaDescartar.push(g.id); 
      }
    });

    // 4. A Metralhadora Dupla (Atira Push e E-mail) 
    const dispararAtaqueDuplo = async (alvos: any[], tituloPush: string, msgPush: string, assuntoEmail: string, corpoEmail: string, nomeRobo: string) => {
      if (alvos.length === 0) return; 
      
      // PREPARA OS ALVOS DE PUSH
      const onesignalIds = alvos.map(a => a.onesignal).filter(id => id);
      if (onesignalIds.length > 0) {
        await dispararPush(onesignalIds, tituloPush, msgPush, nomeRobo);
      }

      // PREPARA OS ALVOS DE E-MAIL
      const emails = alvos.map(a => a.email).filter(e => e);
      if (emails.length > 0) {
        const disparosEmail = emails.map(emailAlvo => 
          resend.emails.send({
            from: REMETENTE_OFICIAL,
            to: emailAlvo,
            subject: assuntoEmail,
            html: corpoEmail
          })
        );
        await Promise.all(disparosEmail).catch(err => console.error('Erro no Resend:', err));
      }
    };

    // 5. O Massacre
    // DIA 3
    await dispararAtaqueDuplo(
        alvosDia3, 
        "Sua consistência caiu. ⚠️", 
        "3 dias sem abrir o app. Volte para a base e mantenha o ritmo.",
        "Sua consistência caiu. ⚠️",
        `<!DOCTYPE html>
        <html lang="pt-BR" style="color-scheme: dark;">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="dark">
          <meta name="supported-color-schemes" content="dark">
        </head>
        <body style="background-color: #0A0A0A; margin: 0; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border: 1px solid #27272A; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #111111; padding: 25px; text-align: center; border-bottom: 1px solid #27272A;">
              <h1 style="color: #F97316; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">PrimalBase</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center; background-color: #0A0A0A;">
              <h2 style="color: #F4F4F5; margin-top: 0; font-size: 22px; font-weight: 600;">O ritmo quebrou.</h2>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 35px;">Registramos 3 dias sem acesso ao aplicativo. Volte para a base e mantenha o ritmo antes que o hábito se perca.</p>
              <a href="https://primalbase.com.br/jornada" style="display: inline-block; background-color: #F97316; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Acessar a Base</a>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #111111; border-top: 1px solid #27272A;">
              <p style="color: #52525B; font-size: 12px; margin: 0;">© 2026 PrimalBase. Disciplina é rotina.</p>
            </div>
          </div>
        </body>
        </html>`,
        'RESGATE (DIA 3)' 
      );
      
      // DIA 7
      await dispararAtaqueDuplo(
        alvosDia7, 
        "Voltando aos velhos hábitos? 🛑", 
        "Uma semana fora. Não deixe a comodidade e a indústria destruírem seu resultado.",
        "Voltando aos velhos hábitos? 🛑",
        `<!DOCTYPE html>
        <html lang="pt-BR" style="color-scheme: dark;">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="background-color: #0A0A0A; margin: 0; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border: 1px solid #27272A; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #111111; padding: 25px; text-align: center; border-bottom: 1px solid #27272A;">
              <h1 style="color: #F97316; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">PrimalBase</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center; background-color: #0A0A0A;">
              <h2 style="color: #F4F4F5; margin-top: 0; font-size: 22px; font-weight: 600;">Uma semana fora do sistema.</h2>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 35px;">Não deixe a comodidade e a indústria destruírem o resultado que você planejou. Retome o controle agora.</p>
              <a href="https://primalbase.com.br/jornada" style="display: inline-block; background-color: #F97316; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Retomar o Controle</a>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #111111; border-top: 1px solid #27272A;">
              <p style="color: #52525B; font-size: 12px; margin: 0;">© 2026 PrimalBase. Disciplina é rotina.</p>
            </div>
          </div>
        </body>
        </html>`,
        'RESGATE (DIA 7)' 
      );
      
      // DIA 15
      await dispararAtaqueDuplo(
        alvosDia15, 
        "Sua rota precisa de ajuste. ⚙️", 
        "Duas semanas off. Atualize seu peso no app e vamos recalcular o plano.",
        "Sua rota precisa de ajuste. ⚙️",
        `<!DOCTYPE html>
        <html lang="pt-BR" style="color-scheme: dark;">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="background-color: #0A0A0A; margin: 0; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border: 1px solid #27272A; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #111111; padding: 25px; text-align: center; border-bottom: 1px solid #27272A;">
              <h1 style="color: #F97316; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">PrimalBase</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center; background-color: #0A0A0A;">
              <h2 style="color: #F4F4F5; margin-top: 0; font-size: 22px; font-weight: 600;">Desvio de Rota Detectado.</h2>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 35px;">Você está há duas semanas sem registrar progresso. Acesse a plataforma, atualize o seu peso atual e deixe a inteligência recalcular o seu plano.</p>
              <a href="https://primalbase.com.br/jornada" style="display: inline-block; background-color: #F97316; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Atualizar Minhas Métricas</a>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #111111; border-top: 1px solid #27272A;">
              <p style="color: #52525B; font-size: 12px; margin: 0;">© 2026 PrimalBase. Disciplina é rotina.</p>
            </div>
          </div>
        </body>
        </html>`,
        'RESGATE (DIA 15)' 
      );
      
      // DIA 30
      await dispararAtaqueDuplo(
        alvosDia30, 
        "Notificações Pausadas. 🔕", 
        "Como você não está acessando, desativamos seus lembretes diários para não incomodar. Abra o app quando quiser retomar o controle.",
        "Notificações Pausadas. 🔕",
        `<!DOCTYPE html>
        <html lang="pt-BR" style="color-scheme: dark;">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="background-color: #0A0A0A; margin: 0; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border: 1px solid #27272A; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #111111; padding: 25px; text-align: center; border-bottom: 1px solid #27272A;">
              <h1 style="color: #52525B; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">PrimalBase</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center; background-color: #0A0A0A;">
              <h2 style="color: #F4F4F5; margin-top: 0; font-size: 22px; font-weight: 600;">Status: Inativo.</h2>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Como você não está acessando a plataforma, desativamos seus lembretes diários para não gerar ruído na sua rotina.</p>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 0;">Basta abrir o aplicativo quando estiver pronto para retomar o controle do plano.</p>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #111111; border-top: 1px solid #27272A;">
              <p style="color: #52525B; font-size: 12px; margin: 0;">© 2026 PrimalBase. Disciplina é rotina.</p>
            </div>
          </div>
        </body>
        </html>`,
        'RESGATE (DIA 30)' 
      );

    // 👇 USANDO O SUPABASE ADMIN NO COVEIRO TAMBÉM
    if (idsParaDescartar.length > 0) {
      await supabaseAdmin
        .from('profiles')
        .update({ onesignal_id: null }) 
        .in('id', idsParaDescartar);
    }

    return NextResponse.json({ 
      success: true, 
      relatorio: {
        dia3: alvosDia3.length,
        dia7: alvosDia7.length,
        dia15: alvosDia15.length,
        dia30: alvosDia30.length,
        inativados: idsParaDescartar.length
      }
    });

  } catch (err) {
    console.error('Erro no funil de resgate:', err);
    return NextResponse.json({ error: 'Falha na missão do funil.' }, { status: 500 });
  }
}