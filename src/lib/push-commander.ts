import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

// Inicializa o Resend com a sua chave do .env
const resend = new Resend(process.env.RESEND_API_KEY);

export async function dispararPush(
  playerIds: string[], 
  titulo: string, 
  mensagem: string, 
  roboOrigem: string
) {
  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!playerIds || playerIds.length === 0) return { success: false, message: 'Sem alvos definidos.' };

  try {
    // 1. Tenta fazer o disparo real pelo OneSignal
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { "en": titulo, "pt": titulo },
        contents: { "en": mensagem, "pt": mensagem }
      })
    });

    if (!response.ok) {
      throw new Error(`OneSignal rejeitou o disparo: ${response.statusText}`);
    }

    // 2. SUCESSO: Guarda no Histórico (push_logs)
    await supabase.from('push_logs').insert({
      robo_origem: roboOrigem,
      titulo: titulo,
      mensagem: mensagem,
      total_alvos: playerIds.length,
      alvos_ids: playerIds,
      status: 'sucesso'
    });

    return { success: true };

  } catch (error: any) {
    const mensagemErro = error.message || JSON.stringify(error);

    // 3. FALHA: Regista no Histórico como erro
    await supabase.from('push_logs').insert({
      robo_origem: roboOrigem,
      titulo: titulo,
      mensagem: mensagem,
      total_alvos: playerIds.length,
      alvos_ids: playerIds,
      status: 'erro',
      detalhes_erro: mensagemErro
    });

    // 4. FALHA: Aciona o seu painel de erros (error_logs)
    await supabase.from('error_logs').insert({
      modulo: 'Push Notification',
      erro: mensagemErro,
      detalhes: `Robô: ${roboOrigem} | Alvos Perdidos: ${playerIds.length}`
    });

    // 5. FALHA CRÍTICA: Dispara o E-mail de Emergência para si
    await resend.emails.send({
      from: 'Sistema PrimalBase <onboarding@resend.dev>', // Ou o seu domínio verificado no Resend
      to: 'joaovitorcoura@gmail.com', // COLOQUE O SEU EMAIL AQUI
      subject: `🚨 ALERTA CRÍTICO: Falha no Robô ${roboOrigem}`,
      html: `
        <h2>Falha no Disparo de Notificações</h2>
        <p>Comandante, o <strong>${roboOrigem}</strong> não conseguiu enviar as notificações.</p>
        <p><strong>Alvos afetados:</strong> ${playerIds.length}</p>
        <p><strong>Detalhes do Erro:</strong> ${mensagemErro}</p>
        <p>Aceda ao painel Admin para verificar o relatório completo.</p>
      `
    });

    return { success: false, error: mensagemErro };
  }
}