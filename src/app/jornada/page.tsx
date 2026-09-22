'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, Lock, ChevronDown, ChevronUp, Info, X, Shield, Zap, Flame, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';
import Confetti from 'react-confetti';

// --- JORNADA ÚNICA DOS 21 DIAS ---
const JOURNEY_DATA = {
  days: [
    {
      day: 1,
      title: "Choque Biológico ⚡",
      lesson: "A vida moderna e o conforto constante deixaram seu corpo preguiçoso. Hoje damos um choque no sistema. A luz do sol da manhã nos olhos regula seu relógio biológico. O frio forja resiliência na mente, enquanto o corte imediato do açúcar inicia a desinflamação do seu organismo.",
      tasks: [
        { id: "1", label: "Foto de Registro (Rosto e corpo - Marco Zero)" },
        { id: "2", label: "Choque Térmico (30s de água 100% gelada no fim do banho)" },
        { id: "3", label: "20 min de Sol Matinal (Sem óculos de sol)" },
        { id: "4", label: "Zero Açúcar (Corte absoluto hoje)" }
      ]
    },
    {
      day: 2,
      title: "Combustível Primordial 🛡️",
      lesson: "Seus hormônios de energia e foco são fabricados a partir de gorduras naturais. Fugir da gordura e viver de carboidratos é o que destrói sua disposição e gera aquele cansaço à tarde. Além disso, passar o dia sentado atrofia sua estrutura física. Hoje resgatamos sua postura e seu metabolismo.",
      tasks: [
        { id: "1", label: "Café Ancestral (Café preto puro + óleo de coco ou manteiga)" },
        { id: "2", label: "3 min de Cócoras Profundo" },
        { id: "3", label: "20 min de Sol Matinal" }
      ]
    },
    {
      day: 3,
      title: "Domínio de Foco e Energia 🛡️",
      lesson: "Olhar o celular logo ao acordar destrói seu foco pelo resto do dia. Aquela fome matinal costuma ser apenas o corpo pedindo rotina, e não comida real. Beba água, segure a primeira hora do dia e assuma o controle da sua mente.",
      tasks: [
        { id: "1", label: "1h em Modo Avião ao acordar" },
        { id: "2", label: "Nutrição Ancestral (Foco 100% em carne, ovos e frutas)" },
        { id: "3", label: "Hidratação com Sal Integral (Para energia imediata)" }
      ]
    },
    {
      day: 4,
      title: "Força Real e Postura ⚡",
      lesson: "Sustentar o próprio peso na barra faz mais do que alinhar a coluna: constrói força de verdade e melhora sua postura instantaneamente. Uma postura forte envia um sinal de autoconfiança direto para o seu cérebro. Use seu corpo todos os dias.",
      tasks: [
        { id: "1", label: "Dead Hang (Sustentação na barra até o seu limite)" },
        { id: "2", label: "20 min de Sol (Perto do meio-dia)" },
        { id: "3", label: "10 min de Leitura" }
      ]
    },
    {
      day: 5,
      title: "Recuperação Biológica 🛡️",
      lesson: "O sono profundo é o momento em que seu corpo realmente se reconstrói e regula os hormônios de energia. A luz das telas à noite destrói a sua melatonina, travando a recuperação. Blindar sua noite é o único jeito de acordar com disposição real amanhã.",
      tasks: [
        { id: "1", label: "Zero Telas após as 21h (Bloquear luz azul)" },
        { id: "2", label: "Sem cafeína após as 14h" },
        { id: "3", label: "5 min de Respiração Profunda antes de deitar" }
      ]
    },
    {
      day: 6,
      title: "Resiliência e Foco ⚡",
      lesson: "O banho gelado faz muito mais do que acelerar o metabolismo: ele treina a sua mente a não fugir do desconforto. Seu cérebro vai mandar você sair da água na hora, mas você fica. Aproveite para preparar seu corpo para o jejum de amanhã com a hidratação certa.",
      tasks: [
        { id: "1", label: "Água + Sal Integral" },
        { id: "2", label: "Banho Gelado (45 segundos ininterruptos)" },
        { id: "3", label: "10 min de Grounding (Pés descalços na terra ou grama)" }
      ]
    },
    {
      day: 7,
      title: "Limpeza Metabólica 🛡️",
      lesson: "O jejum é o descanso perfeito que seu sistema digestivo precisa para desinflamar e baixar a insulina naturalmente. O objetivo não é apenas queimar gordura, mas aprender a sentir a onda da fome bater e passar sem desespero. Você no controle total das suas decisões.",
      tasks: [
        { id: "1", label: "Jejum de 12h a 16h", type: "timer", goal: 16 },
        { id: "2", label: "Luz Solar direta durante o Jejum" },
        { id: "3", label: "10 min de Silêncio Total (Sem celular)" }
      ]
    },
    {
      day: 8,
      title: "Resiliência Matinal ⚡",
      lesson: "A primeira semana adaptou seu corpo, agora treinamos a sua mente. O banho gelado logo cedo força seu cérebro a lidar com o desconforto e ativa o metabolismo na hora. Vencer essa barreira física nos primeiros minutos do dia blinda seu foco para qualquer outro desafio.",
      tasks: [
        { id: "1", label: "Ativação Muscular Rápida (Flexões ou agachamentos)" },
        { id: "2", label: "Banho Gelado (1 minuto ininterrupto)" },
        { id: "3", label: "Café Puro e Água" }
      ]
    },
    {
      day: 9,
      title: "Regulação de Cortisol 🛡️",
      lesson: "Estresse constante e luzes artificiais mantêm seu cortisol alto, bloqueando o descanso real. O contato físico com a terra e o sol da manhã não são misticismo, são sinalizadores biológicos. Eles regulam seu relógio interno, desinflamam o corpo e preparam seu sistema para a alta performance.",
      tasks: [
        { id: "1", label: "15 min de Contato com a Natureza" },
        { id: "2", label: "20 min de Sol Matinal" },
        { id: "3", label: "Nutrição Densa (Proteína animal e gordura natural)" }
      ]
    },
    {
      day: 10,
      title: "Estímulo Metabólico Curto ⚡",
      lesson: "O corpo responde melhor à intensidade do que à duração prolongada. Tiros curtos de velocidade máxima ativam fibras musculares rápidas e otimizam hormônios naturais de recuperação. É o caminho eficiente para sinalizar força sem o desgaste crônico de horas de aeróbico.",
      tasks: [
        { id: "1", label: "Sprints de Alta Intensidade (4 a 6 tiros curtos)" },
        { id: "2", label: "Banho Frio Pós-Treino" },
        { id: "3", label: "Hidratação com Sal Integral" }
      ]
    },
    {
      day: 11,
      title: "Foco Profundo ⚡",
      lesson: "Alternar constantemente entre telas fragmenta sua atenção e esgota sua energia cognitiva. A capacidade de sustentar foco contínuo sem estímulos artificiais de dopamina é o que consolida a alta performance. Assuma o controle do seu ambiente.",
      tasks: [
        { id: "1", label: "90 min de Trabalho Profundo (Foco total)" },
        { id: "2", label: "30 min de Sol UVB (Horário de pico)" },
        { id: "3", label: "Limite Máximo: 15 min de Redes Sociais no dia" }
      ]
    },
    {
      day: 12,
      title: "Descanso Neural 🛡️",
      lesson: "O excesso de informações digitais sobrecarrega o sistema nervoso central. Interromper a entrada de novos estímulos permite que o cérebro descanse e recalibre os receptores de dopamina. O silêncio intencional é a ferramenta mais eficiente contra a fadiga mental.",
      tasks: [
        { id: "1", label: "15 min de Silêncio Visual (Sem telas ou música)" },
        { id: "2", label: "Jejum de Estímulos (Apenas água e café preto)" },
        { id: "3", label: "2 min de Dead Hang (Tempo acumulado)" }
      ]
    },
    {
      day: 13,
      title: "Preparação Metabólica 🛡️",
      lesson: "Amanhã seu corpo entrará em um jejum de 24 horas. Para evitar estresse no sistema, o corpo exige nutrição densa hoje. Abastecer a máquina com proteína animal e gordura sinaliza segurança biológica, preparando sua fisiologia para operar apenas com as próprias reservas.",
      tasks: [
        { id: "1", label: "Jantar de Alta Densidade (Carne, ovos e gorduras naturais)" },
        { id: "2", label: "Fechamento da Janela (Definir horário exato de término)" },
        { id: "3", label: "Dormir Cedo" }
      ]
    },
    {
      day: 14,
      title: "Autofagia e Renovação 🛡️",
      lesson: "Com a insulina estabilizada no jejum estendido, o corpo ativa a autofagia, reciclando células danificadas para gerar energia. Esse processo varre a inflamação do sistema, otimiza hormônios vitais e clareia o foco. A restrição intencional é o mecanismo biológico definitivo de regeneração.",
      tasks: [
        { id: "1", label: "Janela de Jejum Estendido (16h a 24h)", type: "timer", goal: 24 },
        { id: "2", label: "Exposição Solar Direta (20 min ao meio-dia)" },
        { id: "3", label: "Reposição Mineral (Água + sal integral a cada 3h)" }
      ]
    },
    {
      day: 15,
      title: "Blindagem Dopaminérgica ⚡",
      lesson: "O açúcar refinado e as notificações do celular competem pelos mesmos circuitos neurais de recompensa. Ceder a esses microestímulos reduz sua energia de execução para desafios reais. Cortar a dopamina barata recalibra sua motivação biológica direto na base.",
      tasks: [
        { id: "1", label: "Tolerância Zero a Estímulos Rápidos (Sem açúcar e telas à toa)" },
        { id: "2", label: "Exposição ao Frio (Banho 100% gelado por 2 min)" },
        { id: "3", label: "Café Preto Puro" }
      ]
    },
    {
      day: 16,
      title: "Nutrição e Estrutura 🛡️",
      lesson: "Comer com pressa olhando para telas sabota a saciedade e eleva o cortisol, travando a digestão. Associar uma refeição densa a uma caminhada com sobrecarga (Rucking) otimiza a absorção e estimula força estrutural sem destruir as articulações.",
      tasks: [
        { id: "1", label: "Refeição sem Estímulos (Sem celular/TV)" },
        { id: "2", label: "Rucking / Caminhada Tática (20 min com mochila pesada)" },
        { id: "3", label: "20 min de Sol (Após a digestão)" }
      ]
    },
    {
      day: 17,
      title: "Clareza Mental ⚡",
      lesson: "Quando você corta os carboidratos, o seu cérebro muda a fonte de combustível. É por isso que aquela sensação de lentidão desaparece. Sem picos de insulina, você ganha horas de foco profundo. Use essa energia limpa hoje para resolver o problema mais difícil da sua semana.",
      tasks: [
        { id: "1", label: "Foco Absoluto (Executar a tarefa mais importante do dia)" },
        { id: "2", label: "Dead Hang (Até o limite físico)" },
        { id: "3", label: "Hidratação com Sal Integral" }
      ]
    },
    {
      day: 18,
      title: "Força e Longevidade 🛡️",
      lesson: "Músculo não é estética, é o escudo de proteção do seu corpo contra o envelhecimento. Quando você treina até o seu limite físico, envia um sinal direto para o organismo de que ele precisa se tornar mais forte e resistente hoje.",
      tasks: [
        { id: "1", label: "Treino de Força (Pesos ou calistenia pesada)" },
        { id: "2", label: "Reforço na Proteína (Aumentar carne no pós-treino)" },
        { id: "3", label: "30 min de Sol (Horário mais forte)" }
      ]
    },
    {
      day: 19,
      title: "Blindagem do Ambiente 🛡️",
      lesson: "Um corpo sem inflamação sustenta uma mente que não se distrai. Sem o vício diário no açúcar, você volta a ter controle de si mesmo. O segredo para não errar no protocolo a longo prazo é simplesmente não ter o alimento ruim perto de você.",
      tasks: [
        { id: "1", label: "Limpeza Total (Jogar fora ultraprocessados em casa)" },
        { id: "2", label: "Silêncio Digital (Tarde em Modo Avião)" },
        { id: "3", label: "20 min de Contato com a Natureza" }
      ]
    },
    {
      day: 20,
      title: "Controle de Ambiente 🛡️",
      lesson: "Muita luz artificial e ambientes fechados bagunçam seu relógio biológico e mantêm o estresse sempre alto. O contato direto com a natureza força a queda do cortisol e acalma a mente na hora, preparando seu corpo para fechar esse ciclo de adaptação.",
      tasks: [
        { id: "1", label: "Tempo na Natureza (Caminhada ou pés descalços)" },
        { id: "2", label: "Planejamento Focado (Sem celular)" },
        { id: "3", label: "Banho Gelado (Tempo máximo suportado)" }
      ]
    },
    {
      day: 21,
      title: "O Novo Padrão ⚡",
      lesson: "O ciclo está completo. Você dominou o estresse, baixou a insulina e blindou sua mente contra distrações. O jejum consolida essa adaptação e garante a queima de gordura no automático. O protocolo de 21 dias termina, mas o seu novo padrão biológico é permanente.",
      tasks: [
        { id: "1", label: "Jejum de Consolidação (16h contínuas)", type: "timer", goal: 16 },
        { id: "2", label: "30 min de Sol (Perto do meio-dia)" },
        { id: "3", label: "Registro de Evolução (Foto para comparar com Dia 1)" }
      ]
    }
  ]
};

export default function JornadaPage() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  const [currentDay, setCurrentDay] = useState(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [currentTaskGoal, setCurrentTaskGoal] = useState(16);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showClaimButton, setShowClaimButton] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPunishmentModal, setShowPunishmentModal] = useState(false);

  useEffect(() => {
    loadUserJourney();
  }, []);

  useEffect(() => {
    if (currentDay && !expandedDay) {
      setExpandedDay(currentDay);
    }
  }, [currentDay]);

  async function loadUserJourney() {
    try {
      setIsLoadingProfile(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser(authUser);
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_subscriber')
          .eq('id', authUser.id)
          .single();
        setIsSubscriber(profile?.is_subscriber || false);
        setUserId(authUser.id);
      } else {
        // Visitante Anônimo
        setCurrentDay(1);
        setCompletedDays([]);
        setShowIntro(true);
        setLoading(false);
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(false);

      const { data: logsData } = await supabase
        .from('jornada_logs')
        .select('day_number, completed_at')
        .eq('user_id', authUser.id)
        .order('day_number', { ascending: true });

      localStorage.setItem('primal_progress_days', (logsData?.length || 0).toString());

      if (!logsData || logsData.length === 0) {
        setShowIntro(true);
        setCompletedDays([]);
        setCurrentDay(1);
      } else {
        const lastLog = logsData[logsData.length - 1];
        if (lastLog && lastLog.completed_at) {
          const lastCheckIn = new Date(lastLog.completed_at).getTime();
          const now = new Date().getTime();
          const hoursSinceLastCheckin = (now - lastCheckIn) / (1000 * 60 * 60);

          if (hoursSinceLastCheckin > 48) {
            setShowPunishmentModal(true);
            setLoading(false);
            return; 
          }
        }

        const completedDayNumbers = logsData.map((log: any) => log.day_number);
        setCompletedDays(completedDayNumbers);

        const maxCompletedDay = Math.max(...completedDayNumbers);
        if (maxCompletedDay < 21) {
          setCurrentDay(maxCompletedDay + 1);
        } else {
          setCurrentDay(21);
          setShowClaimButton(true);
        }

        const newCompletedTasks: Record<string, boolean> = {};
        
        completedDayNumbers.forEach((dayNum: number) => {
          const dayData = JOURNEY_DATA.days.find((d: any) => d.day === dayNum);
          if (dayData) {
            dayData.tasks.forEach((task: any) => {
              newCompletedTasks[`day${dayNum}_${task.id}`] = true;
            });
          }
        });

        setCompletedTasks(newCompletedTasks);
        setShowIntro(false); 
      }
    } catch (error) {
      console.error('Erro ao carregar jornada:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleResetProtocol = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('jornada_logs')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao resetar:', error);
        alert('Erro ao reiniciar. Verifique se você tem permissão ou contate o suporte.');
        return;
      }

      setCompletedDays([]);
      setCompletedTasks({});
      setCurrentDay(1);
      setShowIntro(true);
      localStorage.removeItem('primal_intro_seen');
      
      window.location.reload();
    } catch (error) {
      console.error('Erro ao resetar protocolo:', error);
    }
  };

  const handleStartChallenge = () => {
    localStorage.setItem('primal_intro_seen', 'true');
    setShowIntro(false);
  };

  async function toggleTask(dayNum: number, taskId: string) {
    if (dayNum > currentDay) return;

    const taskKey = `day${dayNum}_${taskId}`;
    const isCurrentlyCompleted = completedTasks[taskKey];
    const newCompleted = { ...completedTasks, [taskKey]: !isCurrentlyCompleted };
    setCompletedTasks(newCompleted);

    const currentDayData = JOURNEY_DATA.days.find((d: any) => d.day === dayNum);
    if (!currentDayData) return;

    const allTasksCompleted = currentDayData.tasks.every((task: any) => {
      const key = `day${dayNum}_${task.id}`;
      return newCompleted[key] === true;
    });

    if (allTasksCompleted && !completedDays.includes(dayNum)) {
      const newCompletedDays = [...completedDays, dayNum];
      setCompletedDays(newCompletedDays);

      if (dayNum === 21) {
        setShowClaimButton(true);
      } else if (dayNum === currentDay && currentDay < 21) {
        const newCurrentDay = currentDay + 1;
        setCurrentDay(newCurrentDay);
        setExpandedDay(newCurrentDay);
      }

      if (userId) {
        try {
          await supabase
            .from('jornada_logs')
            .insert({
              user_id: userId,
              day_number: dayNum,
              status: 'concluido',
              completed_at: new Date().toISOString(),
            });
        } catch (error) {
          console.error('Erro ao salvar progresso:', error);
        }
      }
    } else if (!allTasksCompleted && completedDays.includes(dayNum)) {
      const newCompletedDays = completedDays.filter(d => d !== dayNum);
      setCompletedDays(newCompletedDays);

      if (dayNum === 21) {
        setShowClaimButton(false);
      }

      if (userId) {
        try {
          await supabase
            .from('jornada_logs')
            .delete()
            .eq('user_id', userId)
            .eq('day_number', dayNum);
        } catch (error) {
          console.error('Erro ao remover progresso:', error);
        }
      }
    }
  }

  function openBenefitsModal(goalHours: number) {
    setCurrentTaskGoal(goalHours);
    setShowBenefitsModal(true);
  }

  function getBenefitsContent(goalHours: number) {
    if (goalHours === 12 || goalHours === 14) {
      return {
        title: 'Descanso & Equilíbrio',
        ring: goalHours,
        timeline: [
          { icon: '🟢', time: '0-4h', label: 'Digestão' },
          { icon: '🔵', time: '8h', label: 'Calmaria da Insulina' },
          { icon: '✨', time: '12-14h', label: 'Início da Queima (Lipólise)' }
        ]
      };
    } else if (goalHours === 16 || goalHours === 18) {
      return {
        title: 'A Máquina de Queima',
        ring: goalHours,
        timeline: [
          { icon: '🟢', time: '12h', label: 'Fim do Glicogênio' },
          { icon: '🟠', time: '14h', label: 'Pico de GH (Crescimento)' },
          { icon: '🔥', time: '16h', label: 'Queima de Gordura Máxima (Cetose)' }
        ]
      };
    } else if (goalHours === 24) {
      return {
        title: 'Reset do Sistema (Autofagia)',
        ring: goalHours,
        timeline: [
          { icon: '🟢', time: '12h', label: 'Digestão Encerrada' },
          { icon: '🟠', time: '14h', label: 'GH no Teto (Proteção Muscular)' },
          { icon: '🔥', time: '16h', label: 'Queima Intensa' },
          { icon: '✨', time: '18h', label: 'Início da Autofagia' },
          { icon: '🧬', time: '24h', label: 'Reset Imunológico' }
        ]
      };
    }

    return {
      title: 'Benefícios do Jejum',
      ring: goalHours,
      timeline: [
        { icon: '🟢', time: '0-12h', label: 'Digestão e Queda da Insulina' },
        { icon: '🔥', time: '12h+', label: 'Queima de Gordura' }
      ]
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Carregando sua jornada...</p>
        </div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center justify-center p-4 md:p-8 bg-zinc-950">
        <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl w-full my-auto py-10">
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] p-8 md:p-14 text-center overflow-hidden flex flex-col justify-center min-h-[50vh]">
            
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 pointer-events-none"></div>
            
            <div className="relative z-10">
              
              <div className="flex justify-center mb-8 md:mb-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <Zap className="relative z-10 w-24 h-24 md:w-32 md:h-32 text-amber-500 filter drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight leading-tight">
                <span className="text-white">O DESPERTAR </span>
                <span className="text-amber-500 block sm:inline">BIOLÓGICO</span>
              </h1>
              
              {isLoadingProfile ? (
                <div className="flex flex-col items-center gap-3 mb-10">
                  <div className="h-6 w-3/4 bg-zinc-800 rounded-md animate-pulse"></div>
                </div>
              ) : (
                <p className="text-xl md:text-2xl lg:text-3xl font-medium text-zinc-400 mb-10">
                  Você está pronto para assumir o controle?
                </p>
              )}

              <div className="bg-zinc-950/60 rounded-2xl p-6 md:p-8 mb-10 text-left relative overflow-hidden shadow-inner border border-zinc-800/50">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div> 
                <p className="text-gray-300 leading-relaxed text-base md:text-lg pl-4">
                  Nos próximos 21 dias, você executará um protocolo prático de restrição intencional, nutrição ancestral e regulação hormonal. Nós vamos remover a inflamação, dominar o cortisol e <strong className="text-amber-400 font-medium">transformar o seu corpo em uma máquina de alta performance.</strong>
                </p>
              </div>

              <button
                onClick={handleStartChallenge}
                disabled={isLoadingProfile}
                className="w-full max-w-md mx-auto bg-amber-500 text-zinc-950 hover:bg-amber-400 font-black text-xl py-5 md:py-6 rounded-2xl shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest relative z-10 outline-none border-none"
              >
                {isLoadingProfile ? 'CARREGANDO...' : 'INICIAR PROTOCOLO'}
              </button>

            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4 pb-40">
      <div className="max-w-4xl mx-auto">
        <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] border border-white/10 p-6 md:p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl shrink-0 shadow-inner">
                  <Shield className="w-8 h-8 text-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mb-1">
                    Protocolo Ancestral
                  </h1>
                  <p className="text-gray-400 text-sm md:text-base font-medium">
                    Performance, Clareza e Domínio Mental
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center bg-zinc-950/80 border border-amber-500/30 rounded-xl p-3 shadow-[0_0_15px_rgba(251,191,36,0.2)] transform hover:scale-105 transition-transform cursor-default w-full md:w-auto">
                <div className="flex items-center gap-1">
                  <Flame className={`w-8 h-8 ${completedDays.length > 0 ? 'text-orange-500 animate-pulse' : 'text-zinc-600'}`} />
                  <span className="text-3xl font-black text-white">{completedDays.length}</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Dias Seguidos</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <div className="flex-1 bg-zinc-800/50 rounded-full h-4 overflow-hidden border border-zinc-700/50">
                <div
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 h-full transition-all duration-500 shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                  style={{ width: `${(completedDays.length / 21) * 100}%` }}
                />
              </div>
              <span className="text-base font-bold text-amber-400 whitespace-nowrap drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                Dia {currentDay}/21
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
        {JOURNEY_DATA.days.map((day) => {
            const prevDayCompleted = day.day === 1 || completedDays.includes(day.day - 1);
            const isDayCompleted = completedDays.includes(day.day);
            
            let status = 'locked';
            if (isDayCompleted) {
              status = 'completed';
            } else if (prevDayCompleted) {
              status = 'current';
            }
            const isExpanded = expandedDay === day.day;
            
            const isPaywallLocked = day.day > 3 && !isSubscriber;
            const isSequentiallyLocked = status === 'locked';
            const isLocked = isPaywallLocked || isSequentiallyLocked;

            const allTasksCompleted = day.tasks.every(task => {
              const taskKey = `day${day.day}_${task.id}`;
              return completedTasks[taskKey];
            });

            const isDay21Complete = day.day === 21 && completedDays.includes(21);

            return (
              <div
                key={day.day}
                className={`backdrop-blur-xl rounded-xl shadow-lg overflow-hidden transition-all duration-300 border ${
                  status === 'completed' 
                    ? 'bg-zinc-900/80 border-amber-500/60 shadow-[0_0_15px_rgba(251,191,36,0.2)]' 
                    : status === 'current' && allTasksCompleted
                    ? 'bg-zinc-800/90 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]' 
                    : status === 'current' 
                    ? 'bg-zinc-800/90 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] relative' 
                    : 'bg-zinc-900/80 border-zinc-800/50'
                } ${isLocked ? 'opacity-70 hover:opacity-100' : ''}`}
              >
                <button
                  onClick={() => {
                    if (isPaywallLocked) {
                      setShowPaywall(true); 
                    } else if (isSequentiallyLocked) {
                      // Nada
                    } else {
                      setExpandedDay(isExpanded ? null : day.day);
                    }
                  }}
                  className={`w-full p-6 flex items-center justify-between transition-colors ${!isSequentiallyLocked ? 'hover:bg-white/5 cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-4">
                    {(status === 'completed' || isDay21Complete) && (
                      <CheckCircle2 className="w-8 h-8 text-amber-500 flex-shrink-0 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                    )}
                    {status === 'current' && !allTasksCompleted && (
                      <Circle className="w-8 h-8 text-orange-500 flex-shrink-0 drop-shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
                    )}
                    {isLocked && (
                      <Lock className={`w-8 h-8 flex-shrink-0 ${isPaywallLocked ? 'text-amber-500/50 animate-pulse' : 'text-zinc-600'}`} /> 
                    )}
                    
                    <div className="text-left">
                      <div className={`text-sm font-medium ${isPaywallLocked ? 'text-amber-500/50' : 'text-gray-500'}`}>
                        {isPaywallLocked ? 'Conteúdo VIP' : isSequentiallyLocked ? `Dia ${day.day} (Bloqueado)` : `Dia ${day.day}`}
                      </div>
                      <div className={`text-xl font-bold ${isLocked ? 'text-gray-400' : 'text-gray-100'}`}>{day.title}</div>
                    </div>
                  </div>

                  <div>
                    {isPaywallLocked ? (
                      <div className="bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                         <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Liberar</span>
                      </div>
                    ) : isSequentiallyLocked ? (
                      <Lock className="w-5 h-5 text-zinc-700" />
                    ) : isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && !isLocked && (
                  <div className="px-6 pb-6 space-y-4 border-t border-zinc-800/50">
                    <div className="backdrop-blur-md bg-zinc-800/50 rounded-lg p-4 mt-4 border border-orange-500/30">
                      <div className="flex items-start gap-2">
                        <span className="text-xl">💡</span>
                        <div>
                          <div className="font-semibold text-amber-400 mb-2">
                            Entender a Ciência
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {day.lesson}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="font-semibold text-gray-100">Tarefas do Dia:</div>
                      {day.tasks.map((task) => {
                        const taskKey = `day${day.day}_${task.id}`;
                        const isCompleted = completedTasks[taskKey];

                        if (task.type === 'timer') {
                          return (
                            <div key={task.id} className="flex items-center gap-3">
                              <button
                                onClick={() => toggleTask(day.day, task.id)}
                                className={`flex items-center gap-3 p-4 rounded-lg transition-all duration-300 backdrop-blur-md active:scale-95 ${
                                  isCompleted
                                    ? 'bg-green-900/30 border-2 border-green-500/60 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                                    : 'bg-zinc-800/50 hover:bg-zinc-800/70 border-2 border-zinc-700/50 hover:border-zinc-600'
                                }`}
                              >
                                {isCompleted ? (
                                  <div className="relative">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                    <Flame className="w-4 h-4 text-orange-500 absolute -top-2 -right-2 animate-bounce drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" />
                                  </div>
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                )}
                                <span className={`${isCompleted ? 'text-green-300 line-through' : 'text-gray-200'} font-medium`}>
                                  {task.label}
                                </span>
                              </button>

                              <button
                                onClick={() => openBenefitsModal(task.goal || 16)}
                                className="flex items-center gap-2 px-4 py-4 border-2 border-orange-500/60 bg-transparent hover:bg-orange-500/10 text-orange-400 hover:text-orange-300 rounded-lg transition-all font-medium backdrop-blur-md"
                              >
                                <Info className="w-5 h-5" />
                                Benefícios
                              </button>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={task.id}
                            onClick={() => toggleTask(day.day, task.id)}
                            className={`w-full flex items-center gap-3 p-4 rounded-lg transition-all duration-300 backdrop-blur-md active:scale-95 ${
                              isCompleted
                                ? 'bg-green-900/30 border-2 border-green-500/60 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                                : 'bg-zinc-800/50 hover:bg-zinc-800/70 border-2 border-zinc-700/50 hover:border-zinc-600'
                            }`}
                          >
                            {isCompleted ? (
                              <div className="relative">
                                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                <Flame className="w-4 h-4 text-orange-500 absolute -top-2 -right-2 animate-bounce drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" />
                              </div>
                            ) : (
                              <Circle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                            )}
                            <span className={`${isCompleted ? 'text-green-300 line-through' : 'text-gray-200'} font-medium`}>
                              {task.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {isDay21Complete && showClaimButton && (
                      <div className="mt-6 animate-bounce">
                        <button
                          onClick={() => setShowVictoryModal(true)}
                          className="w-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 hover:from-yellow-600 hover:via-yellow-500 hover:to-yellow-600 text-gray-900 font-extrabold py-6 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-[0_0_30px_rgba(234,179,8,0.5)] text-base tracking-tight text-center whitespace-nowrap"
                        >
                          CONCLUIR JORNADA
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setShowResetModal(true)}
          className="w-full py-4 mt-8 text-sm text-zinc-500 hover:text-red-500 underline transition-colors"
        >
          Quebrou o Protocolo? Reiniciar
        </button>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-red-950/90 to-zinc-950/90 border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.3)] backdrop-blur-xl">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-red-400 mb-3">
                Reiniciar o Ciclo?
              </h2>
              <p className="text-gray-300 leading-relaxed">
                A integridade é a base de tudo. Se você falhou em algum dia, o protocolo foi quebrado. Deseja reiniciar do Dia 1 para fazer do jeito certo?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-4 rounded-xl transition-all border-2 border-zinc-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  handleResetProtocol();
                }}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]"
              >
                Sim, Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPunishmentModal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[110] backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-zinc-900 border border-orange-500/30 rounded-[2rem] p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            
            <div className="flex justify-center mb-6 relative">
              <X className="w-16 h-16 text-orange-500 relative z-20" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Sequência Interrompida</h2>
            <p className="text-orange-400 font-semibold tracking-widest text-xs uppercase mb-6">RECALCULANDO ROTA</p>
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 mb-8 shadow-inner">
              <p className="text-zinc-400 text-sm leading-relaxed">
                O sistema detectou mais de 48 horas de inatividade. Na biologia, a consistência é a única métrica que gera resultados reais. Sua sequência foi resetada e seu protocolo voltará para o Dia 1.
              </p>
            </div>

            <button
              onClick={() => {
                setShowPunishmentModal(false);
                handleResetProtocol(); 
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95 uppercase tracking-wide"
            >
              REINICIAR PROTOCOLO
            </button>
          </div>
        </div>
      )}

      {showVictoryModal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-500">
          <div className="fixed inset-0 pointer-events-none z-0">
             <Confetti 
               width={typeof window !== 'undefined' ? window.innerWidth : 1000}
               height={typeof window !== 'undefined' ? window.innerHeight : 1000}
               colors={['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#000000']} 
               recycle={false} 
               numberOfPieces={400} 
               gravity={0.15}
             />
          </div>

          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-[0_0_80px_rgba(251,191,36,0.15)] z-50 flex flex-col items-center text-center p-8 md:p-12 [&::-webkit-scrollbar]:hidden scrollbar-hide">
            <button
              onClick={() => setShowVictoryModal(false)}
              className="absolute top-6 right-6 p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors z-10 border border-zinc-700/50"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-zinc-400 hover:text-white" />
            </button>

            <div className="w-full space-y-6 md:space-y-8 relative z-10 mt-4">
              <div className="flex justify-center relative mb-6">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/30 blur-[50px] rounded-full"></div>
                <Shield className="relative z-10 w-24 h-24 md:w-32 md:h-32 text-amber-500 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
              </div>

              <div className="flex flex-col gap-3">
                <h1 className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600 font-black text-4xl md:text-5xl tracking-tighter leading-none uppercase drop-shadow-lg">
                  Jornada Dominada
                </h1>
                <h2 className="text-zinc-400 font-bold tracking-[0.2em] text-sm md:text-base uppercase">
                  A Base Foi Forjada
                </h2>
              </div>

              <div className="bg-zinc-900/60 rounded-2xl p-6 md:p-8 border border-zinc-800/80 relative text-left shadow-inner mx-auto max-w-sm md:max-w-full mt-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-amber-500 rounded-r-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                <p className="text-zinc-300 font-light tracking-wide leading-relaxed text-sm md:text-base pl-5">
                  Você completou o que <strong className="text-white font-bold">99% iniciam e desistem</strong>. O que antes era sacrifício, hoje é sua natureza. A disciplina deixou de ser uma escolha para se tornar <strong className="text-amber-400 font-medium tracking-wide">QUEM VOCÊ É</strong>. A base foi forjada.
                </p>
              </div>

              <div className="w-24 h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent mx-auto"></div>

              <p className="font-serif italic text-zinc-500 text-base md:text-lg">
                "A biologia não perdoa. Isso foi apenas o começo."
              </p>

              <button
                onClick={() => alert("ACESSO RESTRITO 🔒\n\nVocê dominou a base e provou o seu valor.\n\nO Nível 2 exigirá ainda mais do seu corpo e mente. As coordenadas desta nova fase estão sendo preparadas exclusivamente para os que chegaram até aqui.\n\nMantenha seus novos hábitos blindados e aguarde a convocação oficial.")}
                className="w-full relative bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 text-zinc-500 hover:text-amber-500/80 font-black py-5 md:py-6 rounded-2xl text-lg flex items-center justify-center gap-3 mt-8 active:scale-[0.98] uppercase tracking-widest shadow-inner transition-all"
              >
                <Lock className="w-5 h-5" /> ACESSAR NÍVEL 2
              </button>

            </div>
          </div>
        </div>
      )}

     {showBenefitsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/50 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="relative z-20 bg-zinc-900/90 backdrop-blur-sm p-5 md:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase tracking-wider text-sm">A Cirurgia da Natureza</h3>
                  <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">Arquivo Biológico</p>
                </div>
              </div>
              <button
                onClick={() => setShowBenefitsModal(false)}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8 [&::-webkit-scrollbar]:hidden scrollbar-hide flex-1">
              
              {(() => {
                const content = getBenefitsContent(currentTaskGoal); 
                return (
                  <div className="flex flex-col items-center mb-10">
                    <div className="relative w-32 h-32 md:w-36 md:h-36 mb-6">
                      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 192 192">
                        <circle cx="96" cy="96" r="88" stroke="#18181b" strokeWidth="8" fill="none" />
                        <circle cx="96" cy="96" r="88" className="stroke-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" strokeWidth="8" fill="none" strokeDasharray="553" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                          {content.ring}<span className="text-2xl text-amber-500">h</span>
                        </div>
                        <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Meta</div>
                      </div>
                    </div>

                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-6 text-center">
                      {content.title}
                    </h2>

                    <div className="w-full space-y-0 relative">
                      <div className="absolute left-[1.35rem] top-4 bottom-4 w-px bg-zinc-800"></div>
                      {content.timeline.map((phase, index) => (
                        <div key={index} className="flex items-start gap-4 relative pb-6 last:pb-0">
                          <div className="w-11 h-11 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center shadow-inner z-10 shrink-0 relative">
                            <span className="relative z-10">{phase.icon}</span>
                          </div>
                          <div className="pt-1.5 pb-2">
                            <span className="inline-block text-amber-500 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mb-1">
                              {phase.time}
                            </span>
                            <p className="text-zinc-200 font-medium text-sm md:text-base leading-snug">
                              {phase.label}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center gap-4 my-8 opacity-60">
                <div className="flex-1 h-px bg-zinc-800"></div>
                <Info className="w-4 h-4 text-zinc-500" />
                <div className="flex-1 h-px bg-zinc-800"></div>
              </div>

              <div className="space-y-6">
                <h3 className="text-amber-500 font-black text-lg uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5" /> A Mecânica Ancestral
                </h3>

                <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-5">
                  <h4 className="text-white font-bold text-sm uppercase mb-2">A Ilusão da Fome</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">
                    O corpo é como uma criança exigindo comida. Esse sinal chama-se <strong className="text-amber-500/80 font-medium">Grelina</strong>. Ao resistir às primeiras horas, ela despenca. Você descobre que a dor no estômago era apenas um alerta falso do sistema, não risco de morte.
                  </p>
                </div>

                <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-5 border-l-2 border-l-amber-500">
                  <h4 className="text-white font-bold text-sm uppercase mb-2">Preservação Muscular</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">
                    Por que queimar o açúcar primeiro? Porque é fácil. Quando ele acaba, o fígado escolhe. Se você não usar os músculos, ele os queima. Se você treina, ele <strong className="text-amber-500/80 font-medium">protege a massa muscular</strong> e passa a derreter gordura pura como combustível primário.
                  </p>
                </div>

                <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-5">
                  <h4 className="text-white font-bold text-sm uppercase mb-2">Sobrevivência do Mais Forte</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">
                    No jejum longo, o corpo aumenta a produção de <strong className="text-amber-500/80 font-medium">BDNF</strong> (criando novos neurônios) e o <strong className="text-amber-500/80 font-medium">Hormônio do Crescimento (GH)</strong> vai ao teto. O código biológico entende: <span className="italic text-zinc-500">"Se esse cara não ficar mais inteligente e maior agora, ele morre e não reproduz."</span>
                  </p>
                </div>

                <div className="bg-zinc-900 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3 mt-4 shadow-inner">
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-orange-500 font-bold text-xs uppercase mb-1 tracking-wider">Protocolo de Combate</h4>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      Treinar em jejum sem ingerir sais pode causar desmaios. Substitua o pré-treino por <strong className="text-white">Água + 1 colher de chá de sal</strong>. Se a mente fraquejar, tome café preto.
                    </p>
                  </div>
                </div>
              </div>

            </div>

           <div className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0">
              <button
                onClick={() => {
                  setShowBenefitsModal(false);
                  if (userId && currentTaskGoal) {
                    fetch('/api/cron/agendar-jejum', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        userId: userId, 
                        horas: currentTaskGoal 
                      })
                    }).catch(err => console.error('O radar falhou em silêncio:', err));
                  }
                }}
                className="w-full relative group bg-zinc-950 hover:bg-zinc-800 text-amber-500 hover:text-amber-400 font-black py-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-sm border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]"
              >
                Dominar a Fome
              </button>
            </div>

          </div>
        </div>
      )}

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        userId={user?.id || ''} 
      />

      <div className="h-32"></div>
    </div>
  );
}