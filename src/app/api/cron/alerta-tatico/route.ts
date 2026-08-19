import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // 👈 INJEÇÃO DA CHAVE MESTRA
import { dispararPush } from '@/lib/push-commander';

// 👇 CHAVE MESTRA: Usamos a chave Admin para ler todos os perfis ignorando o RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. Busca todos os guerreiros com celular registrado e seus objetivos usando o Admin
    const { data: guerreiros, error } = await supabaseAdmin
      .from('profiles')
      .select('onesignal_id, goal')
      .not('onesignal_id', 'is', null);

    if (error || !guerreiros || guerreiros.length === 0) {
      return NextResponse.json({ message: 'Nenhum alvo encontrado.' });
    }

    // 2. Separa a tropa em dois esquadrões
    const idsGanho: string[] = [];
    const idsSecar: string[] = [];

    guerreiros.forEach((g: any) => {
      const objetivoRaw = (g.goal || '').toLowerCase();
      
      const querGanhar = objetivoRaw.includes('ganho') || objetivoRaw.includes('massa') || objetivoRaw.includes('hipertrofia') || objetivoRaw.includes('crescer');
      
      if (querGanhar) {
        idsGanho.push(g.onesignal_id);
      } else {
        // Se não quer ganhar, assumimos perda/manutenção (Secar)
        idsSecar.push(g.onesignal_id);
      }
    });

    // --- O ARSENAL ROTATIVO (10 MUNIÇÕES CADA) ---
    const arsenalSecar = [
      { titulo: "Fome ou Tédio? 🧠", corpo: "O que você quer comer agora dura 5 minutos na boca e atrapalha dias de progresso. Beba água." },
      { titulo: "A Indústria Quer Você Viciado. 🛑", corpo: "O açúcar oculto no meio da tarde é feito para te controlar. Assuma o volante da sua própria mente." },
      { titulo: "O Espelho Não Mente. 🪞", corpo: "Você está um dia mais perto do alvo. Não jogue o déficit calórico da semana no lixo por um impulso." },
      { titulo: "Modo Queima Ativado. 🎯", corpo: "Seu corpo está usando as próprias reservas como energia agora. Mantenha a guarda alta contra o carboidrato vazio." },
      { titulo: "Disciplina Pesa Gramas. ⚖️", corpo: "O arrependimento pesa na balança. O almoço já foi e o jantar está chegando. Não belisque nada." },
      { titulo: "O Falso Saudável. 🥫", corpo: "Leia o rótulo antes de comer. Aquele \"snack fit\" pode estar lotado de maltodextrina para travar seu metabolismo." },
      { titulo: "O Peso do Hábito. 🔄", corpo: "Se você ceder hoje, vai ser mais fácil ceder amanhã. Quebre o ciclo de dependência do açúcar agora." },
      { titulo: "A Matemática da Queima. 📉", corpo: "Não existe milagre, existe déficit calórico e constância. Faça a próxima refeição dentro do plano." },
      { titulo: "Cortando o Mal pela Raiz. ✂️", corpo: "A vontade de comer doce dura minutos. A inflamação dura dias. Beba um copo de água e espere o pico passar." },
      { titulo: "Foco na Execução. ⚙️", corpo: "Deixe a motivação de lado, foque na disciplina. O plano já foi traçado no aplicativo, agora é só executar sem questionar." }
    ];

    const arsenalGanho = [
      { titulo: "Combustível Real. 💪", corpo: "O músculo não cresce com vento e café. Garanta sua cota de proteína na próxima refeição." },
      { titulo: "Construção Pesada. 🧱", corpo: "Bater caloria com comida limpa é o preço do resultado. O treino foi só o estímulo, a comida é a obra." },
      { titulo: "Mentalidade de Crescimento. 📈", corpo: "Seu corpo é uma máquina que exige energia densa para expandir. Não pule refeições." },
      { titulo: "Força Bruta. 🥩", corpo: "Ganho de massa exige disciplina na mesa. Não deixe o corpo catabolizar por preguiça de preparar a comida." },
      { titulo: "Zero Desculpas. 🛑", corpo: "Se faltar combustível hoje, o treino foi em vão. Feche a meta de calorias antes do dia acabar." },
      { titulo: "A Matemática do Músculo. 📊", corpo: "Você não cresce no treino, cresce na recuperação. E recuperação exige superávit calórico." },
      { titulo: "Sinal Verde para Proteína. 🥩", corpo: "O corpo não estoca proteína para o futuro. Você precisa fornecer matéria-prima constante." },
      { titulo: "O Custo da Preguiça. 📉", corpo: "Pular a refeição por falta de tempo é o caminho mais rápido para perder a massa que você suou para ganhar." },
      { titulo: "Não Confie na Fome. 🧠", corpo: "O corpo vai pedir para você parar de comer. Aja com o racional, bata a meta de macros estipulada." },
      { titulo: "Construção Contínua. 🏗️", corpo: "Seu corpo é um canteiro de obras 24 horas. Não deixe faltar material para a fundação." }
    ];

    // Sorteia uma mensagem aleatória para cada esquadrão
    const tiroSecar = arsenalSecar[Math.floor(Math.random() * arsenalSecar.length)];
    const tiroGanho = arsenalGanho[Math.floor(Math.random() * arsenalGanho.length)];

    // 4. Puxa os gatilhos simultaneamente USANDO A FÁBRICA DE LOGS E IGNORANDO ALVOS VAZIOS
    const promessasAtaque = [];
    if (idsSecar.length > 0) promessasAtaque.push(dispararPush(idsSecar, tiroSecar.titulo, tiroSecar.corpo, 'ROBÔ TÁTICO (SECAR)'));
    if (idsGanho.length > 0) promessasAtaque.push(dispararPush(idsGanho, tiroGanho.titulo, tiroGanho.corpo, 'ROBÔ TÁTICO (GANHO)'));

    if (promessasAtaque.length > 0) {
      await Promise.all(promessasAtaque);
    }

    return NextResponse.json({ 
      success: true, 
      mensagem: "Ataque Segmentado disparado com sucesso!", 
      alvosGanho: idsGanho.length,
      alvosSecar: idsSecar.length,
      tiroUsadoSecar: tiroSecar.titulo,
      tiroUsadoGanho: tiroGanho.titulo
    });

  } catch (error) {
    console.error('Erro geral no cron alerta-tatico:', error);
    return NextResponse.json({ error: 'Falha na operação.' }, { status: 500 });
  }
}