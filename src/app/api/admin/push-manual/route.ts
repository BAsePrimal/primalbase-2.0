import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispararPush } from '@/lib/push-commander';

// 1. INJEÇÃO DA CHAVE MESTRA: Cria um cliente que ignora o RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

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
      
      // Usa o supabaseAdmin em vez do supabase normal
      const { data: alvoUnico, error } = await supabaseAdmin
        .from('profiles')
        .select('onesignal_id')
        .eq('email', emailAlvo)
        .single();

      if (error || !alvoUnico || !alvoUnico.onesignal_id) {
        console.error("Erro na busca do Sniper:", error);
        return NextResponse.json({ error: 'Guerreiro não encontrado ou sem celular registrado.' }, { status: 404 });
      }
      playerIds.push(alvoUnico.onesignal_id);
      nomeRobo = `DISPARO SNIPER (${emailAlvo})`;
    } 
    // 💣 MODO METRALHADORA: Busca a base em massa
    else {
      const { data: guerreiros, error: erroPerfis } = await supabaseAdmin
        .from('profiles')
        .select('id, onesignal_id, goal')
        .not('onesignal_id', 'is', null);

      if (erroPerfis || !guerreiros || guerreiros.length === 0) {
        return NextResponse.json({ error: 'Nenhum alvo encontrado na base.' }, { status: 404 });
      }

      let mapaJornada: Record<string, number> = {};
      
      if (segmento.startsWith('jornada_')) {
        const { data: logs, error: erroLogs } = await supabaseAdmin
          .from('jornada_logs')
          .select('user_id, day_number');
          
        if (!erroLogs && logs) {
          logs.forEach((log: any) => {
            if (!mapaJornada[log.user_id]) mapaJornada[log.user_id] = 0;
            if (log.day_number > mapaJornada[log.user_id]) {
               mapaJornada[log.user_id] = log.day_number;
            }
          });
        }
      }

      guerreiros.forEach((g: any) => {
        const objetivoRaw = (g.goal || '').toLowerCase();
        const querGanhar = objetivoRaw.includes('ganho') || objetivoRaw.includes('massa') || objetivoRaw.includes('hipertrofia') || objetivoRaw.includes('crescer');
        
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