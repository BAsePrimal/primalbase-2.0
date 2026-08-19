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
      { titulo: "Semana Limpa Começa Hoje. ⚔️", corpo: "Quem não planeja no domingo, pede lixo no iFood na segunda. Como está a sua geladeira?" },
      { titulo: "A Regra dos 5 Minutos. ⏱️", corpo: "Abra o aplicativo e monte sua lista de mercado agora. Proteja sua semana contra a falta de tempo." },
      { titulo: "O Erro de Segunda-Feira. 🛑", corpo: "90% falham no almoço amanhã por não ter o que comer. Compre os ingredientes hoje. O Chef IA resolve o resto." },
      { titulo: "O Preço da Preguiça. 💸", corpo: "Se não deixar as refeições esquematizadas, vai gastar mais dinheiro com fast-food amanhã. Assuma o controle." },
      { titulo: "Radar Ligado. 📡", corpo: "Amanhã a correria começa. Facilite a sua vida: deixe a primeira refeição do dia engatilhada e à prova de falhas." },
      { titulo: "A Regra de Ouro. 🔑", corpo: "O sucesso da sua semana mora na prateleira da sua geladeira. Faça o planejamento de compras agora." },
      { titulo: "Sem Surpresas Amanhã. 📅", corpo: "Não acorde segunda-feira para pensar no que vai comer. Decida hoje, deixe o app calcular e execute amanhã." },
      { titulo: "O Custo de Não Planejar. 💸", corpo: "Não ter comida pronta na segunda é garantia de gastar dinheiro com lixo empacotado. Proteja seu bolso." },
      { titulo: "O Controle Retorna. 🎮", corpo: "O final de semana acabou. Hora de voltar o foco 100% para a base. Como estão os macros de amanhã?" },
      { titulo: "Escudo Ativado. 🛡️", corpo: "Deixe a primeira refeição de amanhã no esquema. Um começo de dia limpo garante uma semana forte." }
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