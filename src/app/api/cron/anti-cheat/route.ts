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
      .select('onesignal_id')
      .not('onesignal_id', 'is', null);

    if (error || !usuarios || usuarios.length === 0) {
      return NextResponse.json({ message: 'Nenhum dispositivo encontrado.' });
    }

    const playerIds = usuarios.map((u: any) => u.onesignal_id);

    const mensagensFimDeSemana = [
      { titulo: "Teste de Consistência 🛡️", corpo: "Seu metabolismo não tira folga aos finais de semana. Proteja o progresso dos últimos dias contra alimentos que inflamam." },
      { titulo: "Impacto Hormonal 🛡️", corpo: "O álcool trava a queima de gordura na hora e derruba sua testosterona. Proteja seu equilíbrio hormonal neste final de semana." },
      { titulo: "Custos Biológicos ⚡", corpo: "O pico do açúcar dura minutos; a inflamação no corpo todo dura dias. Mantenha a restrição e o foco na nutrição ancestral." },
      { titulo: "Defesa Biológica 🛡️", corpo: "O ambiente molda o comportamento. Antes de eventos sociais, garanta uma refeição com proteína e gordura animal para segurar sua saciedade." },
      { titulo: "Continuidade Fisiológica ⚡", corpo: "Sua resposta à insulina não para às sextas-feiras. O que você colocar no prato hoje à noite determina sua energia e disposição amanhã." },
      { titulo: "Efeito Cascata 🛡️", corpo: "Quebrar o protocolo na sexta altera sua fome e seus desejos para o resto do final de semana. Mantenha o padrão de alta performance." },
      { titulo: "Armadilha do Açúcar ⚡", corpo: "Carboidratos refinados viciam o cérebro. Troque o prazer passageiro por resultados reais e visíveis no seu corpo a longo prazo." },
      { titulo: "Autonomia Alimentar 🛡️", corpo: "O cardápio moderno é feito para gerar dependência. Assuma o controle de tudo o que você come e opte apenas por comida de verdade." },
      { titulo: "Acúmulo Inflamatório ⚡", corpo: "A resposta inflamatória dos ultraprocessados de hoje vai destruir seu foco até a próxima semana. Escolha a alta performance." },
      { titulo: "Logística de Antecipação 🛡️", corpo: "Nunca deixe a fome decidir por você. Se for a eventos sociais, faça uma refeição densa antes de sair para blindar sua vontade de comer besteira na rua." }
    ];

    const alertaSexta = mensagensFimDeSemana[Math.floor(Math.random() * mensagensFimDeSemana.length)];

    await dispararPush(playerIds, alertaSexta.titulo, alertaSexta.corpo, 'ALERTA BIOLÓGICO (SEXTA)');

    return NextResponse.json({ 
      success: true, 
      mensagem: "Alerta de fim de semana disparado e registrado com sucesso!",
      alvos: playerIds.length,
      alertaUsado: alertaSexta.titulo
    });

  } catch (error) {
    console.error('Erro geral no cron anti-cheat:', error);
    return NextResponse.json({ error: 'Falha na operação.' }, { status: 500 });
  }
}