import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; 
import { dispararPush } from '@/lib/push-commander'; // 👈 IMPORTAÇÃO DA NOSSA FÁBRICA

export async function GET(request: Request) {
  try {
    // 1. Busca os guerreiros
    const { data: guerreiros, error } = await supabase
      .from('profiles')
      .select('onesignal_id')
      .not('onesignal_id', 'is', null);

    if (error || !guerreiros || guerreiros.length === 0) {
      return NextResponse.json({ message: 'Nenhum alvo encontrado.' });
    }

    const playerIds = guerreiros.map((g: any) => g.onesignal_id);

    // --- ARSENAL DE SEXTA-FEIRA (BLINDAGEM DE FIM DE SEMANA) ---
    const arsenalFimDeSemana = [
      { titulo: "A Selva Não Tem Feriado. 🐺", corpo: "Sexta-feira é onde os fracos desistem. O álcool e o lixo de hoje destroem o treino da semana inteira. Escolha seu lado." },
      { titulo: "O Teste Começou. ⚠️", corpo: "O fim de semana chegou. Seus amigos vão te oferecer mediocridade em forma de comida e bebida. Diga não. Mantenha a base." },
      { titulo: "Sexta-feira Sangrenta. 🩸", corpo: "Dois dias comendo lixo não são um 'descanso', são um retrocesso. Mantenha a dieta limpa. O espelho vai te agradecer na segunda." },
      { titulo: "Álcool ou Resultado? 🍻", corpo: "Cada copo de álcool zera a sua testosterona e trava a queima de gordura. Seja o Alfa da mesa e peça água." },
      { titulo: "O Rebanho Festeja. 🐑", corpo: "A maioria vai usar o fim de semana para destruir o corpo. Você não é a maioria. Fique longe do açúcar e da farinha hoje." },
      { titulo: "Sábado de Caça. 🏹", corpo: "Acorde amanhã melhor do que hoje. Não vá dormir com o estômago cheio de lixo industrializado. A disciplina continua." },
      { titulo: "A Fraqueza é Contagiosa. 🦠", corpo: "Evite ambientes que te forçam a errar. Se for sair, coma antes. Não negocie com a fome no meio da rua." },
      { titulo: "O Preço do Final de Semana. 💸", corpo: "Dois dias de erro custam cinco dias de conserto. Não jogue sua semana no lixo. Mantenha a guarda alta." },
      { titulo: "Pizza Não Constrói Alfa. 🍕", corpo: "O pico de dopamina vai passar rápido, o inchaço vai ficar até quarta-feira. Engula a vontade e coma comida real." },
      { titulo: "Tropa de Elite. 🎖️", corpo: "O soldado comum relaxa na sexta. O guerreiro de elite afia a espada. O que você vai jantar hoje define quem você é." }
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