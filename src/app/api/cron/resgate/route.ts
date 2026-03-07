import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  // 1. Segurança: Garante que temos as chaves para atirar
  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
    return NextResponse.json({ error: 'Faltam as chaves do arsenal.' }, { status: 500 });
  }

  try {
    // 2. O Cão Farejador: Busca os guerreiros inativos (Exemplo: Filtra quem tem ID do OneSignal salvo)
    // Na vida real, você pode filtrar pela data do last_checkin aqui
    const { data: guerreirosPerdidos, error } = await supabase
      .from('profiles')
      .select('onesignal_id, full_name')
      .not('onesignal_id', 'is', null);

    if (error || !guerreirosPerdidos || guerreirosPerdidos.length === 0) {
      return NextResponse.json({ message: 'Nenhum alvo encontrado hoje.' });
    }

    // Pega só os IDs dos celulares
    const alvos = guerreirosPerdidos.map((g: any) => g.onesignal_id);

    // 3. Montagem da Ogiva (Notificação Rica com Deep Link e Botões)
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: alvos, // Dispara só para os IDs específicos que o banco achou!
      headings: { 
        en: "A selva sente sua falta. 🐺", 
        pt: "A selva sente sua falta. 🐺" 
      },
      contents: { 
        en: "O lobo que não caça, passa fome. Volte para o plano e registre seu progresso!", 
        pt: "O lobo que não caça, passa fome. Volte para o plano e registre seu progresso!" 
      },
      // 👇 MELHORIA 1: Deep Link - Abre o app DIRETO na tela da Jornada
      url: "https://seusite.com.br/jornada", 
      // 👇 MELHORIA 2: Botões de Ação na própria notificação
      buttons: [
        { id: "checkin_btn", text: "Fazer Check-in Agora", icon: "ic_menu_send" }
      ]
    };

    // 4. O Disparo
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
    console.error('Erro no robô de resgate:', err);
    return NextResponse.json({ error: 'Falha na missão.' }, { status: 500 });
  }
}