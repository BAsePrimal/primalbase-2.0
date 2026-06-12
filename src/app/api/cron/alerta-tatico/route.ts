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
      { titulo: "A dor é temporária. 🔥", corpo: "A fome que você sente agora é a gordura sendo destruída. Beba água e mantenha a guarda alta. A selva não perdoa." },
      { titulo: "Fome ou Tédio? 🐺", corpo: "Lobo alfa não come por ansiedade. O que você quer comer agora dura 5 minutos na boca e meses na barriga. Foco." },
      { titulo: "O Espelho Não Mente. 🪞", corpo: "Você está um dia mais perto do seu objetivo. Não jogue o progresso da semana no lixo por fraqueza momentânea." },
      { titulo: "Modo Caçador. 🎯", corpo: "Seu corpo está usando suas próprias reservas de gordura como energia agora. Deixe o processo acontecer. Mantenha-se limpo." },
      { titulo: "Disciplina Pesa Gramas. ⚖️", corpo: "O arrependimento pesa toneladas. O almoço já foi e o jantar está chegando. Não belisque nada até lá." },
      { titulo: "O Controle é Seu. 🧠", corpo: "O açúcar e o lixo industrializado foram feitos para te viciar. Mostre quem manda na sua própria mente." },
      { titulo: "Mente Blindada. 🛡️", corpo: "A vontade de errar vai passar, mas a frustração de ter errado fica. Segure a onda. Você é mais forte que isso." },
      { titulo: "O Preço da Base. 🩸", corpo: "Ninguém forja um corpo de elite comendo o que a maioria come. Pague o preço hoje para vestir o resultado amanhã." },
      { titulo: "Foco no Alvo. 🔭", corpo: "Se você fraquejar hoje, terá que compensar amanhã. Mantenha a rota limpa e o sacrifício será menor no final." },
      { titulo: "A Regra do Alfa. 👑", corpo: "Predadores não se rendem ao primeiro sinal de desconforto. Beba água gelada, respire e volte para a missão." }
    ];

    const arsenalGanho = [
      { titulo: "Combustível Primal. 💪", corpo: "O músculo não cresce com vento. Está na hora da sua cota de proteína real. Vá devorar algo agora." },
      { titulo: "Construção Pesada. 🧱", corpo: "Você não vai crescer pulando refeições. Bata sua meta de calorias hoje. O treino foi só o estímulo, a comida é a obra." },
      { titulo: "Força Bruta. 🦍", corpo: "Massa magra exige disciplina na mesa. Não deixe o corpo catabolizar. Faça a próxima refeição valer a pena." },
      { titulo: "A Regra é Clara. 🥩", corpo: "Quer ficar maior que o rebanho? Tem que comer mais limpo e em mais quantidade que eles. Vá bater sua meta de proteína." },
      { titulo: "Plano de Crescimento. 📈", corpo: "Seu corpo é uma fornalha. Jogue lenha de verdade nele. Pular refeição hoje é perder o treino de ontem." },
      { titulo: "Engolindo a Meta. 🍽️", corpo: "Comer muito quando não se tem fome é o sacrifício de quem quer crescer. Vá fazer o que tem que ser feito." },
      { titulo: "Zero Desculpas. 🛑", corpo: "Se faltar comida hoje, o treino foi em vão. Garanta sua ingestão calórica antes que o dia acabe. Aja como um alfa." },
      { titulo: "O Tijolo de Hoje. 🏗️", corpo: "Cada grama de proteína que você ingere hoje é um tijolo a mais na carcaça de amanhã. Não economize na comida real." },
      { titulo: "Mentalidade de Ogro. 🧌", corpo: "Você não é um passarinho. A sua máquina exige energia pesada para expandir. Vá comer." },
      { titulo: "Forjando a Armadura. ⚔️", corpo: "Ganho de massa é consistência bruta. Não adianta treinar pesado e comer pouco. Destrua a sua próxima refeição." }
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