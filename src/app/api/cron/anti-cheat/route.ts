import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // 👈 IMPORTAÇÃO DA CHAVE MESTRA
import { dispararPush } from '@/lib/push-commander';

// 👇 INJEÇÃO DA CHAVE MESTRA: Cria um cliente que ignora as restrições do RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 👇 USANDO O SUPABASE ADMIN PARA EXTRAIR TODOS OS IDs SEM BLOQUEIO
    const { data: guerreiros, error } = await supabaseAdmin
      .from('profiles')
      .select('onesignal_id')
      .not('onesignal_id', 'is', null);

    if (error || !guerreiros || guerreiros.length === 0) {
      return NextResponse.json({ message: 'Nenhum alvo encontrado.' });
    }

    const playerIds = guerreiros.map((g: any) => g.onesignal_id);

    // --- ARSENAL DE SEXTA-FEIRA (BLINDAGEM DE FIM DE SEMANA) ---
    const arsenalFimDeSemana = [
      { titulo: "O Fim de Semana Chegou. ⚠️", corpo: "A indústria fatura alto hoje. O álcool e o lixo vão destruir o treino da semana? Mantenha a base limpa." },
      { titulo: "Álcool vs Testosterona. 🍻", corpo: "Cada copo trava a queima de gordura e bagunça a sua regulação hormonal. Escolha sua prioridade." },
      { titulo: "O Preço de 2 Dias de Erro. 💸", corpo: "O pico de dopamina da pizza passa hoje, a inflamação e o inchaço ficam até quarta. Coma como um adulto." },
      { titulo: "A Fraqueza é Contagiosa. 🦠", corpo: "Evite ambientes que te forçam a errar. Se for sair, coma proteína antes. Não negocie com a fome na rua." },
      { titulo: "Sem Feriado Para o Corpo. 🥩", corpo: "O seu metabolismo não sabe que hoje é sexta. O que você vai jantar hoje define a disposição de amanhã." },
      { titulo: "Cuidado com as Exceções. ⚠️", corpo: "Uma exceção na sexta vira três no sábado. O final de semana é onde a maioria joga o resultado no lixo." },
      { titulo: "O Açúcar do Fim de Semana. 🍩", corpo: "Não troque resultados sólidos por 5 minutos de prazer palatável. Mantenha a rota limpa hoje à noite." },
      { titulo: "Lado a Lado com o Foco. 🛡️", corpo: "O ambiente de hoje vai testar sua disciplina. Não terceirize suas escolhas para o cardápio do bar." },
      { titulo: "A Fatura de Segunda-feira. 🧾", corpo: "Todo lixo industrializado que você comer hoje e amanhã será cobrado na balança segunda de manhã." },
      { titulo: "Estratégia de Sobrevivência. 🗺️", corpo: "Vai sair hoje? Faça uma refeição densa em proteína antes. Não chegue com fome no território inimigo." }
    ];

    // Sorteia a munição
    const tiroSexta = arsenalFimDeSemana[Math.floor(Math.random() * arsenalFimDeSemana.length)];

    // 2. Dispara e Registra usando a Fábrica Centralizada
    await dispararPush(playerIds, tiroSexta.titulo, tiroSexta.corpo, 'ROBÔ ANTI-CHEAT (SEXTA)');

    return NextResponse.json({ 
      success: true, 
      mensagem: "Anti-Cheat (Sexta) disparado e registrado com sucesso!",
      alvos: playerIds.length,
      tiroUsado: tiroSexta.titulo
    });

  } catch (error) {
    console.error('Erro geral no cron anti-cheat:', error);
    return NextResponse.json({ error: 'Falha na operação.' }, { status: 500 });
  }
}