import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { dispararPush } from '@/lib/push-commander'; // 👈 NOSSA FÁBRICA DE LOGS E PUSH

// Deixe apenas o texto do remetente aqui fora
const REMETENTE_OFICIAL = 'PrimalBase <suporte@primalbase.com.br>'; 

export async function GET(request: Request) {
  // 👇 O Resend fica DENTRO da função GET
  const resend = new Resend(process.env.RESEND_API_KEY);

  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
    return NextResponse.json({ error: 'Faltam as chaves do arsenal.' }, { status: 500 });
  }

  try {
    const tresDiasAtras = new Date();
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

    // 2. O Radar puxa o e-mail também
    const { data: guerreiros, error } = await supabase
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

    // 4. A Metralhadora Dupla (Atira Push e E-mail) - AGORA COM A FÁBRICA
    const dispararAtaqueDuplo = async (alvos: any[], tituloPush: string, msgPush: string, assuntoEmail: string, corpoEmail: string, nomeRobo: string) => {
      if (alvos.length === 0) return; 
      
      // PREPARA OS ALVOS DE PUSH
      const onesignalIds = alvos.map(a => a.onesignal).filter(id => id);
      if (onesignalIds.length > 0) {
        // 👇 Usa a fábrica de tiro centralizada
        await dispararPush(onesignalIds, tituloPush, msgPush, nomeRobo);
      }

      // PREPARA OS ALVOS DE E-MAIL (Dispara individualmente para proteger a privacidade)
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
        // Atira os E-mails todos de uma vez
        await Promise.all(disparosEmail).catch(err => console.error('Erro no Resend:', err));
      }
    };

    // 5. O Massacre (Cópia de Guerra Brutal)
    
    // DIA 3
    await dispararAtaqueDuplo(
        alvosDia3, 
        "A selva sente a sua falta. 🐺", 
        "3 dias sem check-in. O lobo que não caça, passa fome.",
        "A selva sente a sua falta... 🐺",
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
              <h2 style="color: #F4F4F5; margin-top: 0; font-size: 22px; font-weight: 600;">Onde está você, guerreiro?</h2>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Já fazem 3 dias que não dá as caras na matilha.</p>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 35px;">O lobo que não caça, passa fome. Volte para o plano e registre o seu progresso.</p>
              <a href="https://primalbase.com.br/jornada" style="display: inline-block; background-color: #F97316; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Retornar à Base</a>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #111111; border-top: 1px solid #27272A;">
              <p style="color: #52525B; font-size: 12px; margin: 0;">© 2026 PrimalBase. A selva não perdoa.</p>
            </div>
          </div>
        </body>
        </html>`,
        'RESGATE (DIA 3)' // 👈 O Nome do Robô para o seu Admin
      );
      
      // DIA 7
      await dispararAtaqueDuplo(
        alvosDia7, 
        "Você desistiu da jornada? 🩸", 
        "Uma semana fora. A mediocridade do mundo moderno está te puxando.",
        "Você desistiu da jornada? 🩸",
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
              <h2 style="color: #F4F4F5; margin-top: 0; font-size: 22px; font-weight: 600;">Uma semana fora do radar.</h2>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">A mediocridade do mundo moderno está te puxando de volta.</p>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 35px;">Você vai ceder aos velhos hábitos ou vai provar o contrário agora?</p>
              <a href="https://primalbase.com.br/jornada" style="display: inline-block; background-color: #F97316; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Provar o Contrário</a>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #111111; border-top: 1px solid #27272A;">
              <p style="color: #52525B; font-size: 12px; margin: 0;">© 2026 PrimalBase. A selva não perdoa.</p>
            </div>
          </div>
        </body>
        </html>`,
        'RESGATE (DIA 7)' // 👈 O Nome do Robô para o seu Admin
      );
      
      // DIA 15
    await dispararAtaqueDuplo(
        alvosDia15, 
        "Protocolo de Choque Liberado ⚠️", 
        "Destrua o lixo que você comeu nas últimas duas semanas. Acesso expira em 24h.",
        "Protocolo de Choque Liberado ⚠️",
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
              <h2 style="color: #F4F4F5; margin-top: 0; font-size: 22px; font-weight: 600;">O Estrago Pode Ser Revertido.</h2>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Duas semanas fora do plano. Sabemos que o mundo moderno te envenenou.</p>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">O Chef Primal acabou de liberar um <strong>Protocolo de Choque de 3 Dias</strong> para limpar o seu corpo e te colocar de volta no modo alfa.</p>
              <p style="color: #EF4444; font-size: 14px; font-weight: bold; line-height: 1.6; margin-bottom: 35px;">⚠️ Este protocolo confidencial vai sumir do seu radar em 24 horas.</p>
              <a href="https://primalbase.com.br/jornada" style="display: inline-block; background-color: #F97316; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Acessar Protocolo de Choque</a>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #111111; border-top: 1px solid #27272A;">
              <p style="color: #52525B; font-size: 12px; margin: 0;">© 2026 PrimalBase. A selva não perdoa.</p>
            </div>
          </div>
        </body>
        </html>`,
        'RESGATE (DIA 15)' // 👈 O Nome do Robô para o seu Admin
      );
      
      // DIA 30
      await dispararAtaqueDuplo(
        alvosDia30, 
        "Baixa na Alcateia. Descanse. 🪦", 
        "Notificações pausadas. Volte quando quiser ser um alfa novamente.",
        "Baixa na Alcateia. Descanse. 🪦",
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
              <h2 style="color: #F4F4F5; margin-top: 0; font-size: 22px; font-weight: 600;">Descanse em paz.</h2>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Entendemos que você escolheu outro caminho.</p>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Suas notificações automáticas foram pausadas permanentemente.</p>
              <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin-bottom: 0;">Volte apenas quando estiver pronto para ser um alfa novamente.</p>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #111111; border-top: 1px solid #27272A;">
              <p style="color: #52525B; font-size: 12px; margin: 0;">© 2026 PrimalBase. A selva não perdoa.</p>
            </div>
          </div>
        </body>
        </html>`,
        'RESGATE (DIA 30)' // 👈 O Nome do Robô para o seu Admin
      );

    // 6. O Coveiro (Inativa os usuários de 30 dias para poupar o banco de dados)
    if (idsParaDescartar.length > 0) {
      await supabase
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