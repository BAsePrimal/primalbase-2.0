import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // 👈 IMPORTAÇÃO NECESSÁRIA PARA A CHAVE MESTRA
import { dispararPush } from '@/lib/push-commander';

// 👇 INJEÇÃO DA CHAVE MESTRA: Cria um cliente que ignora o RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET(request: Request) {
  try {
    // 👇 USANDO O SUPABASE ADMIN PARA PERFURAR O ESCUDO DE SEGURANÇA
    const { data: guerreiros, error } = await supabaseAdmin
      .from('profiles')
      .select('onesignal_id')
      .not('onesignal_id', 'is', null);

    if (error || !guerreiros || guerreiros.length === 0) {
      return NextResponse.json({ message: 'Nenhum alvo encontrado.' });
    }

    const playerIds = guerreiros.map((g: any) => g.onesignal_id);

    // --- ARSENAL DE DOMINGO (PLANEJAMENTO E PREPARAÇÃO) ---
    const arsenalDomingo = [
      { titulo: "A Guerra Recomeça Amanhã. ⚔️", corpo: "Sua geladeira está pronta? Quem não planeja a semana no domingo, planeja o próprio fracasso na segunda. Organize a base." },
      { titulo: "O Preço da Preguiça. 💸", corpo: "Se você não preparar suas refeições hoje, vai comer lixo amanhã por 'falta de tempo'. Tire 30 minutos e faça o que tem que ser feito." },
      { titulo: "Semana Limpa. 🥩", corpo: "O que você vai comer amanhã já está decidido? Não deixe sua dieta na mão da fome e do acaso. Abra o app e veja o plano." },
      { titulo: "A Vantagem do Alfa. 🐺", corpo: "Enquanto o rebanho chora pelo fim do domingo, o guerreiro prepara a armadura para segunda. Vá conferir a despensa." },
      { titulo: "O Erro de Segunda-Feira. 🛑", corpo: "90% das dietas quebram na segunda no horário do almoço por falta de marmita. Você não faz parte dos 90%. Prepare-se hoje." },
      { titulo: "Radar Ligado. 📡", corpo: "Amanhã o despertador vai tocar e a correria começa. Facilite a sua própria vida: deixe a primeira refeição do dia engatilhada." },
      { titulo: "Visão de Longo Prazo. 🔭", corpo: "Como você quer que seu corpo esteja na próxima sexta? Isso não se decide na quinta, se constrói hoje à noite. Foco." },
      { titulo: "O Cheiro do Fracasso. 🍔", corpo: "Sabe qual é o cheiro do fracasso? O do iFood chegando na segunda-feira porque você não foi ao mercado hoje. Assuma o controle." },
      { titulo: "A Regra dos 5 Minutos. ⏱️", corpo: "Leva 5 minutos para abrir o aplicativo e anotar o que precisa comprar no mercado. Faça isso agora. Proteja sua semana." },
      { titulo: "Mentalidade de Caçador. 🏹", corpo: "O caçador não acorda de estômago vazio sem saber para onde ir. Ele mapeia o terreno antes. Qual é o plano de amanhã?" }
    ];

    const tiroDomingo = arsenalDomingo[Math.floor(Math.random() * arsenalDomingo.length)];

    // Dispara e registra usando a fábrica centralizada
    await dispararPush(playerIds, tiroDomingo.titulo, tiroDomingo.corpo, 'ROBÔ DOMINGO (PREPARAÇÃO)');

    return NextResponse.json({ 
      success: true, 
      mensagem: "Robô de Domingo disparado e registrado com sucesso!",
      alvos: playerIds.length,
      tiroUsado: tiroDomingo.titulo
    });

  } catch (error) {
    console.error('Erro geral no cron domingo:', error);
    return NextResponse.json({ error: 'Falha na operação.' }, { status: 500 });
  }
}