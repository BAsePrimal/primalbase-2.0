import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, horas } = body;

    if (!userId || !horas) {
      return NextResponse.json({ error: 'Parâmetros insuficientes.' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onesignal_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.onesignal_id) {
      return NextResponse.json({ error: 'Dispositivo não encontrado (OneSignal ID ausente).' }, { status: 404 });
    }

    const playerId = profile.onesignal_id;

    const dataDisparo = new Date();
    dataDisparo.setHours(dataDisparo.getHours() + Number(horas));
    
    const sendAfterString = dataDisparo.toISOString();

    const titulo = `⚡ ${horas}h de Jejum Concluído`;
    const mensagem = `Seu corpo operou ${horas}h em alta performance. A queima de gordura está no pico. Abra o app para ver a opção certa de quebrar o jejum sem picos de insulina.`;

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [playerId],
        headings: { en: titulo, pt: titulo },
        contents: { en: mensagem, pt: mensagem },
        send_after: sendAfterString,
      }),
    });

    if (!response.ok) {
      throw new Error('Falha de agendamento na API do OneSignal.');
    }

    await supabase.from('push_logs').insert({
      robo_origem: `ALERTA BIOLÓGICO (${horas}h)`,
      titulo: titulo,
      mensagem: mensagem,
      total_alvos: 1,
      alvos_ids: [playerId],
      status: 'sucesso',
      detalhes_erro: `Agendado para: ${sendAfterString}`
    });

    return NextResponse.json({ success: true, agendadoPara: sendAfterString });

  } catch (error) {
    console.error('Erro no sistema de alertas de jejum:', error);
    return NextResponse.json({ error: 'Falha no sistema de notificações.' }, { status: 500 });
  }
}