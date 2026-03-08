import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

// Deixe apenas o texto do remetente aqui fora
const REMETENTE_OFICIAL = 'PrimalBase <suporte@primalbase.com.br>'; 

export async function GET(request: Request) {
  // 👇 MUDANÇA AQUI: O Resend agora fica DENTRO da função GET
  const resend = new Resend(process.env.RESEND_API_KEY);

  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
    return NextResponse.json({ error: 'Faltam as chaves do arsenal.' }, { status: 500 });
  }

  try {
    const tresDiasAtras = new Date();
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

    // 2. O Radar agora puxa o e-mail também
    const { data: guerreiros, error } = await supabase
      .from('profiles')
      .select('id, onesignal_id, updated_at, email') // 🚨 ADICIONADO 'email' AQUI
      .not('onesignal_id', 'is', null)
      .lt('updated_at', tresDiasAtras.toISOString());

    if (error || !guerreiros || guerreiros.length === 0) {
      return NextResponse.json({ message: 'Nenhum alvo no funil hoje. A matilha está ativa.' });
    }

    // 3. Os Baldes agora guardam o objeto completo (Push + E-mail)
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

    // 4. A Metralhadora Dupla (Atira Push e E-mail ao mesmo tempo)
    const dispararAtaqueDuplo = async (alvos: any[], tituloPush: string, msgPush: string, assuntoEmail: string, corpoEmail: string) => {
      if (alvos.length === 0) return; 
      
      // PREPARA OS ALVOS DE PUSH
      const onesignalIds = alvos.map(a => a.onesignal).filter(id => id);
      if (onesignalIds.length > 0) {
        const payloadPush = {
          app_id: ONESIGNAL_APP_ID,
          include_player_ids: onesignalIds,
          headings: { en: tituloPush, pt: tituloPush },
          contents: { en: msgPush, pt: msgPush },
          url: "https://primalbase.com.br/jornada"
        };

        // Atira Push (Não trava o código se der erro)
        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_REST_KEY}`,
          },
          body: JSON.stringify(payloadPush)
        }).catch(err => console.error('Erro no Push:', err));
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
        "A selva sente sua falta. 🐺", 
        "3 dias sem check-in. O lobo que não caça, passa fome.",
        "A selva sente sua falta... 🐺",
        `<div style="max-width: 600px; margin: 0 auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #18181b; padding: 25px; text-align: center; border-bottom: 1px solid #27272a;">
            <h1 style="color: #ef4444; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">PrimalBase</h1>
          </div>
          
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #f4f4f5; margin-top: 0; font-size: 22px; font-weight: 600;">Onde você está, guerreiro?</h2>
            
            <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Já fazem 3 dias que você não dá as caras na matilha.
            </p>
            <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 35px;">
              O lobo que não caça, passa fome. Volte para o plano e registre seu progresso.
            </p>
            
            <a href="https://primalbase.com.br/jornada" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
              Retornar à Base
            </a>
          </div>
          
          <div style="padding: 20px; text-align: center; background-color: #18181b; border-top: 1px solid #27272a;">
            <p style="color: #52525b; font-size: 12px; margin: 0;">© 2026 PrimalBase. A selva não perdoa.</p>
          </div>
        </div>`
      );
    
    // DIA 7
    await dispararAtaqueDuplo(
      alvosDia7, 
      "Você desistiu da jornada? 🩸", 
      "Uma semana fora. A mediocridade do mundo moderno está te puxando.",
      "Você desistiu da jornada? 🩸",
      `<div style="font-family: sans-serif; padding: 20px; background-color: #18181b; color: #f4f4f5; text-align: center;">
        <h2 style="color: #ef4444;">Uma semana fora do radar.</h2>
        <p>A mediocridade do mundo moderno está te puxando de volta.</p>
        <p>Você vai ceder aos velhos hábitos ou vai provar o contrário agora?</p>
        <a href="https://primalbase.com.br/jornada" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold;">Provar o Contrário</a>
      </div>`
    );
    
    // DIA 15
    await dispararAtaqueDuplo(
      alvosDia15, 
      "Seu lugar na matilha está em risco. ⚠️", 
      "Vai continuar comendo lixo industrializado? Novas receitas liberadas.",
      "Seu lugar na matilha em risco ⚠️",
      `<div style="font-family: sans-serif; padding: 20px; background-color: #18181b; color: #f4f4f5; text-align: center;">
        <h2 style="color: #fbbf24;">Alerta Vermelho</h2>
        <p>Enquanto você esteve fora, o Chef Primal criou novas receitas brutais.</p>
        <p>Você vai voltar para a comida real ou vai continuar se envenenando com lixo industrial?</p>
        <a href="https://primalbase.com.br/jornada" style="display: inline-block; padding: 12px 24px; background-color: #fbbf24; color: #18181b; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold;">Ver Novas Receitas</a>
      </div>`
    );
    
    // DIA 30
    await dispararAtaqueDuplo(
      alvosDia30, 
      "Baixa na Alcateia. Descanse. 🪦", 
      "Notificações pausadas. Volte quando quiser ser um alfa novamente.",
      "Baixa na Alcateia. Descanse. 🪦",
      `<div style="font-family: sans-serif; padding: 20px; background-color: #18181b; color: #f4f4f5; text-align: center;">
        <h2 style="color: #71717a;">Descanse em paz.</h2>
        <p>Entendemos que você escolheu outro caminho.</p>
        <p>Suas notificações automáticas foram pausadas permanentemente.</p>
        <p>Volte apenas quando estiver pronto para ser um alfa novamente.</p>
      </div>`
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