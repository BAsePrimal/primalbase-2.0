import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Ajuste o caminho se necessário

export async function GET(request: Request) {
  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) {
    return NextResponse.json({ error: 'Faltam as chaves do OneSignal.' }, { status: 500 });
  }

  try {
    // 1. Busca todos os guerreiros com celular registrado e seus objetivos
    const { data: guerreiros, error } = await supabase
      .from('profiles')
      .select('onesignal_id, goal, goal_type')
      .not('onesignal_id', 'is', null);

    if (error || !guerreiros || guerreiros.length === 0) {
      return NextResponse.json({ message: 'Nenhum alvo encontrado.' });
    }

    // 2. Separa a tropa em dois esquadrões
    const idsGanho: string[] = [];
    const idsSecar: string[] = [];

    guerreiros.forEach((g: any) => {
      const objetivoRaw = (g.goal || g.goal_type || '').toLowerCase();
      
      const querGanhar = objetivoRaw.includes('ganho') || objetivoRaw.includes('massa') || objetivoRaw.includes('hipertrofia') || objetivoRaw.includes('crescer');
      
      if (querGanhar) {
        idsGanho.push(g.onesignal_id);
      } else {
        // Se não quer ganhar, assumimos perda/manutenção (Secar)
        idsSecar.push(g.onesignal_id);
      }
    });

    // 3. Função para disparar a munição
    const dispararPush = async (playerIds: string[], titulo: string, mensagem: string) => {
      if (playerIds.length === 0) return;
      
      const payloadPush = {
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { "en": titulo, "pt": titulo },
        contents: { "en": mensagem, "pt": mensagem }
      };

      await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_REST_KEY}`,
        },
        body: JSON.stringify(payloadPush)
      }).catch(err => console.error('Erro no disparo OneSignal:', err));
    };

    // 4. Puxa os gatilhos simultaneamente
    await Promise.all([
      dispararPush(
        idsSecar, 
        "A dor é temporária. 🔥", 
        "A fome que você sente agora é a gordura sendo destruída. Beba água e mantenha a guarda alta. A selva não perdoa."
      ),
      dispararPush(
        idsGanho, 
        "Combustível Primal. 💪", 
        "O músculo não cresce com vento. Está na hora da sua cota de proteína real. Vá devorar algo agora."
      )
    ]);

    return NextResponse.json({ 
      success: true, 
      mensagem: "Ataque Segmentado disparado com sucesso!", 
      alvosGanho: idsGanho.length,
      alvosSecar: idsSecar.length
    });

  } catch (error) {
    console.error('Erro geral no cron alerta-tatico:', error);
    return NextResponse.json({ error: 'Falha na operação.' }, { status: 500 });
  }
}