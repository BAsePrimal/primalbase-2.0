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
      const { data: guerreiros, error } = await supabase
        .from('profiles')
        .select('onesignal_id, goal')
        .not('onesignal_id', 'is', null);

      if (error || !guerreiros || guerreiros.length === 0) {
        return NextResponse.json({ error: 'Nenhum alvo encontrado na base.' }, { status: 404 });
      }

      guerreiros.forEach((g: any) => {
        const objetivoRaw = (g.goal || '').toLowerCase();
        const querGanhar = objetivoRaw.includes('ganho') || objetivoRaw.includes('massa') || objetivoRaw.includes('hipertrofia') || objetivoRaw.includes('crescer');

        if (segmento === 'todos') {
          playerIds.push(g.onesignal_id);
        } else if (segmento === 'ganho' && querGanhar) {
          playerIds.push(g.onesignal_id);
        } else if (segmento === 'secar' && !querGanhar) {
          playerIds.push(g.onesignal_id);
        }
      });
    }

    if (playerIds.length === 0) {
      return NextResponse.json({ error: 'O segmento escolhido está vazio.' }, { status: 404 });
    }

    // Fogo!
    await dispararPush(playerIds, titulo, mensagem, nomeRobo);

    return NextResponse.json({ success: true, alvos: playerIds.length });

  } catch (error) {
    console.error('Erro no disparo manual:', error);
    return NextResponse.json({ error: 'Falha no sistema de artilharia.' }, { status: 500 });
  }
}