import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
    return NextResponse.json({ error: 'Faltam as chaves.' }, { status: 500 });
  }

  try {
    // ⏱️ O CÁLCULO DE TEMPO: Pega a data de exatos 3 dias atrás
    const limiteDias = new Date();
    limiteDias.setDate(limiteDias.getDate() - 3);
    const dataCorteISO = limiteDias.toISOString();

    // 🕵️ O Cão Farejador Inteligente:
    // Pega quem TEM ID de notificação (não é null)
    // E que a ÚLTIMA VEZ que entrou (updated_at) foi ANTES de 3 dias atrás (lt = less than)
    const { data: guerreirosPerdidos, error } = await supabase
      .from('profiles')
      .select('onesignal_id, full_name, updated_at')
      .not('onesignal_id', 'is', null)
      .lt('updated_at', dataCorteISO);

    if (error || !guerreirosPerdidos || guerreirosPerdidos.length === 0) {
      return NextResponse.json({ message: 'Nenhum alvo sumido hoje. Todos estão caçando.' });
    }

    const alvos = guerreirosPerdidos.map((g: any) => g.onesignal_id);

    // 🦁 A Ogiva do Leão
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: alvos,
      headings: { 
        en: "A selva sente sua falta. 🦁", 
        pt: "A selva sente sua falta. 🦁" 
      },
      contents: { 
        en: "Um verdadeiro leão não abandona a caça. Volte para o plano e registre seu progresso!", 
        pt: "Um verdadeiro leão não abandona a caça. Volte para o plano e registre seu progresso!" 
      },
      url: "https://primalbase.com.br/jornada", 
      buttons: [
        { id: "checkin_btn", text: "Fazer Check-in Agora", icon: "ic_menu_send" }
      ]
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    return NextResponse.json({ 
      success: true, 
      message: 'Robô finalizou a varredura.', 
      alvosAtingidos: alvos.length,
      oneSignalResponse: result
    });

  } catch (err) {
    console.error('Erro no robô:', err);
    return NextResponse.json({ error: 'Falha na missão.' }, { status: 500 });
  }
}