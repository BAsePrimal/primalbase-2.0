import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Puxando as chaves de acesso do seu arquivo .env
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, horas } = body;

    if (!userId || !horas) {
      return NextResponse.json({ error: 'Munição incompleta.' }, { status: 400 });
    }

    // 1. Rastrear o celular (ID) do guerreiro no banco de dados
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onesignal_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.onesignal_id) {
      return NextResponse.json({ error: 'Alvo sem radar (OneSignal ID não encontrado).' }, { status: 404 });
    }

    const playerId = profile.onesignal_id;

    // 2. Matemática de Combate: Calcular a hora exata do fim do jejum
    const dataDisparo = new Date();
    dataDisparo.setHours(dataDisparo.getHours() + Number(horas));
    
    // Converte a data para o padrão universal que o OneSignal exige
    const sendAfterString = dataDisparo.toISOString();

    // 3. Preparar a Copy da Notificação
    const titulo = "🔥 Protocolo Concluído.";
    const mensagem = `Seu jejum de ${horas}h terminou. Seu corpo já fez o trabalho duro. Agora quebre o jejum com comida de verdade, sem pico de insulina.`;

    // 4. Enviar ordem de agendamento para a API do OneSignal
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
        send_after: sendAfterString, // 👈 O SEGREDO DO CRONÔMETRO ESTÁ AQUI
      }),
    });

    if (!response.ok) {
      throw new Error('O OneSignal recusou o agendamento.');
    }

    // 5. Opcional, mas tático: Salvar no seu Histórico de Ataques (Admin)
    await supabase.from('push_logs').insert({
      robo_origem: `CRONÔMETRO JEJUM (${horas}h)`,
      titulo: titulo,
      mensagem: mensagem,
      total_alvos: 1,
      alvos_ids: [playerId],
      status: 'sucesso',
      detalhes_erro: `Agendado para: ${sendAfterString}`
    });

    return NextResponse.json({ success: true, agendadoPara: sendAfterString });

  } catch (error) {
    console.error('Erro no Sniper de Jejum:', error);
    return NextResponse.json({ error: 'Falha no sistema de artilharia.' }, { status: 500 });
  }
}