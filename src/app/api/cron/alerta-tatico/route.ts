import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; 
import { dispararPush } from '@/lib/push-commander';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { data: usuarios, error } = await supabaseAdmin
      .from('profiles')
      .select('onesignal_id, goal')
      .not('onesignal_id', 'is', null);

    if (error || !usuarios || usuarios.length === 0) {
      return NextResponse.json({ message: 'Nenhum dispositivo encontrado.' });
    }

    const idsGanho: string[] = [];
    const idsSecar: string[] = [];

    usuarios.forEach((u: any) => {
      const objetivoRaw = (u.goal || '').toLowerCase();
      
      const querGanhar = objetivoRaw.includes('ganho') || objetivoRaw.includes('massa') || objetivoRaw.includes('hipertrofia') || objetivoRaw.includes('crescer');
      
      if (querGanhar) {
        idsGanho.push(u.onesignal_id);
      } else {
        idsSecar.push(u.onesignal_id);
      }
    });

    const arsenalSecar = [
      { titulo: "Fome ou Fadiga Mental? ⚡", corpo: "O pico de dopamina de um doce dura minutos; a inflamação dura dias. Proteja sua insulina, beba água e retome o foco." },
      { titulo: "Engenharia do Vício 🛡️", corpo: "O açúcar da tarde foi desenhado para causar dependência. Assuma o controle da sua biologia e não quebre a restrição." },
      { titulo: "Consistência Biológica 🛡️", corpo: "Seu corpo está no meio de um processo de adaptação. Não sabote a sua evolução por um impulso de 5 minutos." },
      { titulo: "Modo Lipólise Ativado ⚡", corpo: "Seu metabolismo está usando as próprias reservas como energia. Mantenha a restrição e não interrompa o processo biológico." },
      { titulo: "Restrição Intencional 🛡️", corpo: "O resultado é forjado no espaço vazio entre as refeições. Mantenha o sistema digestivo em repouso absoluto até a janela abrir." },
      { titulo: "O Risco Oculto 🛡️", corpo: "A maioria dos 'snacks fit' esconde óleos inflamatórios que travam o metabolismo. Fique na nutrição ancestral." },
      { titulo: "Reprogramação Neural ⚡", corpo: "Ceder hoje treina seu cérebro para falhar amanhã. Quebre o ciclo de dependência do carboidrato vazio agora mesmo." },
      { titulo: "Ciência da Otimização ⚡", corpo: "Não existe milagre, existe constância metabólica. Abra o aplicativo e planeje sua próxima refeição com comida de verdade." },
      { titulo: "Oscilação de Cortisol ⚡", corpo: "A fissura passageira por doces é apenas uma oscilação hormonal. Hidrate-se e espere o pico baixar naturalmente." },
      { titulo: "Execução Fria 🛡️", corpo: "Motivação oscila, disciplina biológica é constante. O protocolo já está traçado no Primal Base, limite-se a executar." }
    ];

    const arsenalGanho = [
      { titulo: "Construção Ancestral ⚡", corpo: "O músculo exige matéria-prima densa para expandir. Garanta abundância de proteína animal e gordura natural na sua próxima refeição." },
      { titulo: "Superávit Estratégico ⚡", corpo: "O treino foi apenas o estímulo. O crescimento real exige combustível limpo. Coma até a saciedade plena com alimentos densos." },
      { titulo: "Demanda Metabólica ⚡", corpo: "Sua biologia agora é uma máquina que exige energia para hipertrofiar. Pular refeições destrói o processo de adaptação." },
      { titulo: "Prevenção Catabólica 🛡️", corpo: "O ganho de massa não aceita negligência. Forneça nutrientes densos antes que seu corpo quebre tecido muscular por energia." },
      { titulo: "Otimização de Resultados ⚡", corpo: "Se faltar combustível hoje, o estresse metabólico do treino foi em vão. Forneça a matéria-prima ancestral antes do dia acabar." },
      { titulo: "Ciência da Recuperação 🛡️", corpo: "A hipertrofia não acontece no treino, acontece na janela de recuperação. E regeneração muscular exige densidade nutricional." },
      { titulo: "Síntese Proteica ⚡", corpo: "O corpo humano não estoca proteína para uso futuro. A regeneração das fibras exige fornecimento constante e absorção de nutrientes reais." },
      { titulo: "Logística Nutricional 🛡️", corpo: "A fadiga de decisão corrói seus ganhos. Use o Chef IA do app para estruturar refeições ricas em proteína sem gastar esforço mental." },
      { titulo: "Controle Biológico 🛡️", corpo: "Para crescer, não confie apenas na fome leve. Garanta uma ingestão robusta de carne e nutrientes para forçar a adaptação muscular." },
      { titulo: "Ambiente Anabólico ⚡", corpo: "A regeneração das suas fibras musculares acontece 24 horas por dia. Mantenha o sistema abastecido com nutrição de alta biodisponibilidade." }
    ];

    const alertaSecar = arsenalSecar[Math.floor(Math.random() * arsenalSecar.length)];
    const alertaGanho = arsenalGanho[Math.floor(Math.random() * arsenalGanho.length)];

    const promessasAlerta = [];
    if (idsSecar.length > 0) promessasAlerta.push(dispararPush(idsSecar, alertaSecar.titulo, alertaSecar.corpo, 'ALERTA BIOLÓGICO (SECAR)'));
    if (idsGanho.length > 0) promessasAlerta.push(dispararPush(idsGanho, alertaGanho.titulo, alertaGanho.corpo, 'ALERTA BIOLÓGICO (GANHO)'));

    if (promessasAlerta.length > 0) {
      await Promise.all(promessasAlerta);
    }

    return NextResponse.json({ 
      success: true, 
      mensagem: "Alerta Tático disparado com sucesso!", 
      alvosGanho: idsGanho.length,
      alvosSecar: idsSecar.length,
      alertaUsadoSecar: alertaSecar.titulo,
      alertaUsadoGanho: alertaGanho.titulo
    });

  } catch (error) {
    console.error('Erro geral no cron alerta-tatico:', error);
    return NextResponse.json({ error: 'Falha na operação.' }, { status: 500 });
  }
}