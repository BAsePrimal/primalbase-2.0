import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { dispararPush } from '@/lib/push-commander';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { titulo, mensagem, segmento, emailAlvo } = body;

    if (!titulo || !mensagem || !segmento) {
      return NextResponse.json({ error: 'Munição incompleta. Preencha os campos.' }, { status: 400 });
    }

    let playerIds: string[] = [];
    let nomeRobo = `DISPARO MANUAL (${segmento.toUpperCase()})`;

    // 🎯 MODO SNIPER: Busca apenas 1 guerreiro específico
    if (segmento === 'especifico') {
      if (!emailAlvo) return NextResponse.json({ error: 'Informe o e-mail do alvo.' }, { status: 400 });
      
      const { data: alvoUnico } = await supabase
        .from('profiles')
        .select('onesignal_id')
        .eq('email', emailAlvo)
        .single();

      if (!alvoUnico || !alvoUnico.onesignal_id) {
        return NextResponse.json({ error: 'Guerreiro não encontrado ou sem celular registrado.' }, { status: 404 });
      }
      playerIds.push(alvoUnico.onesignal_id);
      nomeRobo = `DISPARO SNIPER (${emailAlvo})`;
    } 
    // 💣 MODO METRALHADORA: Busca a base em massa
    else {
      // 1. Busca todos os perfis que têm celular registrado (agora pegando o 'id' também)
      const { data: guerreiros, error: erroPerfis } = await supabase
        .from('profiles')
        .select('id, onesignal_id, goal')
        .not('onesignal_id', 'is', null);

      if (erroPerfis || !guerreiros || guerreiros.length === 0) {
        return NextResponse.json({ error: 'Nenhum alvo encontrado na base.' }, { status: 404 });
      }

      // 2. Se o tiro for focado na Jornada, busca a inteligência de progresso
      let mapaJornada: Record<string, number> = {};
      
      if (segmento.startsWith('jornada_')) {
        const { data: logs, error: erroLogs } = await supabase
          .from('jornada_logs')
          .select('user_id, day_number');
          
        if (!erroLogs && logs) {
          // Descobre qual foi o dia máximo que cada usuário concluiu
          logs.forEach((log: any) => {
            if (!mapaJornada[log.user_id]) mapaJornada[log.user_id] = 0;
            if (log.day_number > mapaJornada[log.user_id]) {
               mapaJornada[log.user_id] = log.day_number;
            }
          });
        }
      }

      // 3. Filtra os alvos e carrega a arma
      guerreiros.forEach((g: any) => {
        const objetivoRaw = (g.goal || '').toLowerCase();
        const querGanhar = objetivoRaw.includes('ganho') || objetivoRaw.includes('massa') || objetivoRaw.includes('hipertrofia') || objetivoRaw.includes('crescer');
        
        // Pega o dia máximo do cara (se ele não existir no mapa, é 0)
        const diaMaximo = mapaJornada[g.id] || 0;

        if (segmento === 'todos') {
          playerIds.push(g.onesignal_id);
        } else if (segmento === 'ganho' && querGanhar) {
          playerIds.push(g.onesignal_id);
        } else if (segmento === 'secar' && !querGanhar) {
          playerIds.push(g.onesignal_id);
        } else if (segmento === 'jornada_veterano' && diaMaximo >= 21) {
          playerIds.push(g.onesignal_id);
        } else if (segmento === 'jornada_combate' && diaMaximo > 0 && diaMaximo < 21) {
          playerIds.push(g.onesignal_id);
        } else if (segmento === 'jornada_reserva' && diaMaximo === 0) {
          playerIds.push(g.onesignal_id);
        }
      });
    }

    if (playerIds.length === 0) {
      return NextResponse.json({ error: 'O segmento escolhido está vazio. Ninguém se encaixa nesse perfil.' }, { status: 404 });
    }

    // Fogo!
    await dispararPush(playerIds, titulo, mensagem, nomeRobo);

    return NextResponse.json({ success: true, alvos: playerIds.length });

  } catch (error) {
    console.error('Erro no disparo manual:', error);
    return NextResponse.json({ error: 'Falha no sistema de artilharia.' }, { status: 500 });
  }
}