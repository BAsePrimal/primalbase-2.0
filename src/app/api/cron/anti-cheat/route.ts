import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
    return NextResponse.json({ error: 'Faltam as chaves do OneSignal.' }, { status: 500 });
  }

  try {
    // 1. Busca todos os guerreiros que têm celular registrado (OneSignal ID)
    const { data: guerreiros, error } = await supabase
      .from('profiles')
      .select('onesignal_id')
      .not('onesignal_id', 'is', null);

    if (error || !guerreiros || guerreiros.length === 0) {
      return NextResponse.json({ message: 'Nenhum alvo encontrado.' });
    }

    // 2. Extrai apenas os IDs em uma lista limpa
    const playerIds = guerreiros.map((g: any) => g.onesignal_id);

    // 3. Prepara a munição (A Mensagem de Choque)
    const payloadPush = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { "en": "Fim de semana chegou. ⚠️", "pt": "Fim de semana chegou. ⚠️" },
      contents: { 
        "en": "O mundo vai tentar te envenenar com lixo hoje. Mantenha a guarda alta. A selva não tem folga.", 
        "pt": "O mundo vai tentar te envenenar com lixo hoje. Mantenha a guarda alta. A selva não tem folga." 
      }
    };

    // 4. Puxa o gatilho
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify(payloadPush)
    }).catch(err => console.error('Erro no disparo anti-cheat:', err));

    return NextResponse.json({ 
      success: true, 
      mensagem: "Ataque Anti-Cheat disparado com sucesso!", 
      alvosAtingidos: playerIds.length 
    });

  } catch (error) {
    console.error('Erro geral no cron anti-cheat:', error);
    return NextResponse.json({ error: 'Falha na operação.' }, { status: 500 });
  }
}