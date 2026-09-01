import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispararPush } from '@/lib/push-commander';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET(request: Request) {
  try {
    const { data: usuarios, error } = await supabaseAdmin
      .from('profiles')
      .select('onesignal_id')
      .not('onesignal_id', 'is', null);

    if (error || !usuarios || usuarios.length === 0) {
      return NextResponse.json({ message: 'Nenhum dispositivo encontrado.' });
    }

    const playerIds = usuarios.map((u: any) => u.onesignal_id);

    const mensagensDomingo = [
      { titulo: "A Semana Começa Hoje 📋", corpo: "Quem não planeja no domingo, cede ao iFood na segunda. Como está o estoque de comida de verdade na sua geladeira?" },
      { titulo: "A Regra dos 5 Minutos ⚡", corpo: "Abra o aplicativo e monte sua lista de mercado agora. Proteja seus resultados contra a correria que começa amanhã." },
      { titulo: "O Ponto de Falha 🛡️", corpo: "A maioria desiste no almoço de segunda por não ter o que comer. Garanta os ingredientes hoje e deixe o Chef Primal sugerir o prato amanhã." },
      { titulo: "O Preço da Desorganização ⚡", corpo: "Sem comida limpa na geladeira, a rotina te engole. Assuma o controle hoje para não depender de fast-food amanhã." },
      { titulo: "Preparação Antecipada 📋", corpo: "Amanhã a correria volta. Facilite sua vida: deixe os ingredientes da primeira refeição engatilhados e à prova de desculpas." },
      { titulo: "A Base de Tudo 🛡️", corpo: "O sucesso do seu Protocolo Ancestral mora na prateleira da sua geladeira. Faça seu planejamento de compras hoje à noite." },
      { titulo: "Sem Fadiga de Decisão ⚡", corpo: "Não acorde segunda-feira para adivinhar o que vai comer. Organize os ingredientes hoje e deixe o Primal Base te guiar amanhã." },
      { titulo: "Blindagem para a Semana 🛡️", corpo: "Não ter comida na segunda é o caminho mais rápido para acabar consumindo ultraprocessados. Proteja seu corpo e sua rotina." },
      { titulo: "O Foco Retorna ⚡", corpo: "O final de semana acabou. Hora de voltar a atenção 100% para a nutrição ancestral. Você já sabe o que vai comer amanhã?" },
      { titulo: "Garantindo a Segunda 🛡️", corpo: "Deixe a primeira refeição de amanhã esquematizada. Um começo de dia limpo e com foco é o que garante uma semana inteira de resultados." }
    ];

    const alertaDomingo = mensagensDomingo[Math.floor(Math.random() * mensagensDomingo.length)];

    await dispararPush(playerIds, alertaDomingo.titulo, alertaDomingo.corpo, 'ALERTA BIOLÓGICO (DOMINGO)');

    return NextResponse.json({ 
      success: true, 
      mensagem: "Alerta de planejamento disparado e registrado com sucesso!",
      alvos: playerIds.length,
      alertaUsado: alertaDomingo.titulo
    });

  } catch (error) {
    console.error('Erro geral no cron domingo:', error);
    return NextResponse.json({ error: 'Falha na operação.' }, { status: 500 });
  }
}