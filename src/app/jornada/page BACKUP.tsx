'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JOURNEY_DATA } from '@/lib/journeyData';
import { CheckCircle2, Circle, Lock, ChevronDown, ChevronUp, Info, X, Trophy, Sparkles, AlertTriangle, Clock, Activity, Flame, Shield, Zap} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';
import Confetti from 'react-confetti';

type Protocol = 'male' | 'female' | null;

interface FastingTimer {
  startTime: number;
  goalHours: number;
}

export default function JornadaPage() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [protocol, setProtocol] = useState<Protocol>(null);
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
  const [userGender, setUserGender] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  // Carregar dados do usuário e jornada
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
      }
    
      
      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Buscar perfil para determinar protocolo
      const { data: profileData } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single();

      if (profileData) {
        // NORMALIZAÇÃO DE STRING - Detectar gênero com .toLowerCase() e .includes()
        const genderLower = profileData.gender?.toLowerCase() || '';
        const isMale = genderLower.includes('masculino') || genderLower.includes('leão');
        const userProtocol = isMale ? 'male' : 'female';
        
        setProtocol(userProtocol);
        setUserGender(profileData.gender);
        setIsLoadingProfile(false);

        // Buscar dias completados na tabela jornada_logs
        const { data: logsData } = await supabase
          .from('jornada_logs')
          .select('day_number')
          .eq('user_id', user.id)
          .order('day_number', { ascending: true });

        // Salva para a Home ler depois
        localStorage.setItem('primal_progress_days', (logsData?.length || 0).toString());

        // LÓGICA AJUSTADA: Se lista vazia, mostrar intro
        if (!logsData || logsData.length === 0) {
          // Nenhum check-in feito - mostrar introdução
          setShowIntro(true);
          setCompletedDays([]);
          setCurrentDay(1);
        } else {
          // Tem check-ins - mostrar tela normal
          const completedDayNumbers = logsData.map((log: any) => log.day_number);
          setCompletedDays(completedDayNumbers);

          // Definir dia atual como o próximo dia não completado
          const maxCompletedDay = Math.max(...completedDayNumbers);
          if (maxCompletedDay < 21) {
            setCurrentDay(maxCompletedDay + 1);
          } else {
            setCurrentDay(21);
            setShowClaimButton(true);
          }

          // Marcar tarefas como completadas baseado nos dias completados
          const newCompletedTasks: Record<string, boolean> = {};
          const protocolData = JOURNEY_DATA[userProtocol];
          
          completedDayNumbers.forEach((dayNum: number) => {
            const dayData = protocolData.days.find((d: any) => d.day === dayNum);
            if (dayData) {
              dayData.tasks.forEach((task: any) => {
                newCompletedTasks[`day${dayNum}_${task.id}`] = true;
              });
            }
          });

          setCompletedTasks(newCompletedTasks);
          setShowIntro(false); // Já tem progresso, não mostrar intro
        }
      }
    } catch (error) {
      console.error('Erro ao carregar jornada:', error);
    } finally {
      setLoading(false);
    }
  }

  // Selecionar protocolo (caso não tenha perfil)
  const handleSelectProtocol = async (protocolType: 'male' | 'female') => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Atualizar perfil com gênero
      const gender = protocolType === 'male' ? 'Masculino' : 'Feminino';
      await supabase
        .from('profiles')
        .update({ gender })
        .eq('id', userId);

      setProtocol(protocolType);
      setUserGender(gender);
    } catch (error) {
      console.error('Erro ao salvar protocolo:', error);
      alert('Erro ao salvar protocolo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Resetar protocolo - SAFE RESET COM TRATAMENTO DE ERRO
  const handleResetProtocol = async () => {
    if (!userId) return;

    try {
      // Tentar deletar todos os logs da jornada
      const { error } = await supabase
        .from('jornada_logs')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao resetar:', error);
        alert('Erro ao reiniciar. Verifique se você tem permissão para deletar registros ou contate o suporte.');
        return;
      }

      // SUCESSO: Forçar estado para tela de Introdução
      setCompletedDays([]);
      setCompletedTasks({});
      setCurrentDay(1);
      setShowIntro(true);
      localStorage.removeItem('primal_intro_seen');
      
      // Recarregar página para garantir limpeza total
      window.location.reload();
    } catch (error) {
      console.error('Erro ao resetar protocolo:', error);
      alert('Erro ao resetar protocolo. Tente novamente.');
    }
  };

  // Começar desafio (fechar intro)
  const handleStartChallenge = () => {
    localStorage.setItem('primal_intro_seen', 'true');
    setShowIntro(false);
  };

  // Toggle de tarefa e inserção no banco - CORRIGIDO COM RECÁLCULO ESTRITO E NUVEM
  async function toggleTask(dayNum: number, taskId: string) {
    if (dayNum > currentDay || !userId) return;

    const taskKey = `day${dayNum}_${taskId}`;
    const isCurrentlyCompleted = completedTasks[taskKey];
    const newCompleted = { ...completedTasks, [taskKey]: !isCurrentlyCompleted };
    setCompletedTasks(newCompleted);

    // Verificar se todas as tarefas do dia foram completadas
    const protocolData = protocol ? JOURNEY_DATA[protocol] : null;
    if (!protocolData) return;

    const currentDayData = protocolData.days.find((d: any) => d.day === dayNum);
    if (!currentDayData) return;

    // RECÁLCULO ESTRITO: Verificar se TODAS as tarefas estão marcadas
    const allTasksCompleted = currentDayData.tasks.every((task: any) => {
      const key = `day${dayNum}_${task.id}`;
      return newCompleted[key] === true;
    });

    // LÓGICA CORRIGIDA: Recalcular status do dia em TODA interação
    if (allTasksCompleted && !completedDays.includes(dayNum)) {
      // TODAS as tarefas completadas E dia ainda não estava marcado como concluído
      try {
        // Inserir na tabela jornada_logs com o status concluido
        await supabase
          .from('jornada_logs')
          .insert({
            user_id: userId,
            day_number: dayNum,
            status: 'concluido',
            completed_at: new Date().toISOString(),
          });

        // Atualizar estado local
        const newCompletedDays = [...completedDays, dayNum];
        setCompletedDays(newCompletedDays);

        // Se completou o Dia 21, mostrar botão de reivindicar
        if (dayNum === 21) {
          setShowClaimButton(true);
          return;
        }

        // Avançar para o próximo dia
        if (dayNum === currentDay && currentDay < 21) {
          const newCurrentDay = currentDay + 1;
          setCurrentDay(newCurrentDay);
          setExpandedDay(newCurrentDay);
        }
      } catch (error) {
        console.error('Erro ao salvar progresso:', error);
        alert('Erro ao salvar progresso. Tente novamente.');
      }
    } else if (!allTasksCompleted && completedDays.includes(dayNum)) {
      // PELO MENOS UMA tarefa desmarcada E dia estava marcado como concluído
      try {
        // Remover da tabela jornada_logs
        await supabase
          .from('jornada_logs')
          .delete()
          .eq('user_id', userId)
          .eq('day_number', dayNum);

        // Atualizar estado local - remover dia da lista de completados
        const newCompletedDays = completedDays.filter(d => d !== dayNum);
        setCompletedDays(newCompletedDays);

        // Se era o dia 21, esconder botão de reivindicar
        if (dayNum === 21) {
          setShowClaimButton(false);
        }
      } catch (error) {
        console.error('Erro ao remover progresso:', error);
        alert('Erro ao atualizar progresso. Tente novamente.');
      }
    }
  }

  function openBenefitsModal(goalHours: number) {
    setCurrentTaskGoal(goalHours);
    setShowBenefitsModal(true);
  }

  function getDayStatus(dayNum: number): 'completed' | 'current' | 'locked' {
    if (completedDays.includes(dayNum)) return 'completed';
    if (dayNum === currentDay) return 'current';
    return 'locked';
  }

  // Função para determinar o conteúdo do modal baseado na meta de jejum
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
          { icon: '🟠', time: '14h', label: 'Pico de GH (Hormônio do Crescimento)' },
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
          { icon: '🔥', time: '16h', label: 'Queima Intensa de Gordura' },
          { icon: '✨', time: '18h', label: 'Início da Autofagia (Limpeza)' },
          { icon: '🧬', time: '24h', label: 'Reset Imunológico & Células Tronco' }
        ]
      };
    }

    // Fallback padrão
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

  // Tela de seleção de protocolo (caso não tenha)
  if (!protocol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Escolha Seu Protocolo
            </h1>
            <p className="text-lg text-gray-600">
              Selecione o protocolo que melhor se adapta ao seu objetivo
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <button
              onClick={() => handleSelectProtocol('male')}
              disabled={loading}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left border-4 border-transparent hover:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-6xl mb-4">🦁</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Protocolo Leão
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                Força, Testosterona e Domínio Mental.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ 21 dias de transformação</p>
                <p>✓ Foco em força e energia</p>
                <p>✓ Otimização hormonal masculina</p>
              </div>
            </button>

            <button
              onClick={() => handleSelectProtocol('female')}
              disabled={loading}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left border-4 border-transparent hover:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-6xl mb-4">🐆</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Protocolo Leoa
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                Hormônios, Energia e Vitalidade.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ 21 dias de renovação</p>
                <p>✓ Equilíbrio hormonal feminino</p>
                <p>✓ Energia e beleza natural</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const protocolData = JOURNEY_DATA[protocol];

// Tela de Introdução (Onboarding) - DARK MODE PREMIUM COM SKELETON RESPONSIVO
if (showIntro) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center justify-center p-4 md:p-8 bg-zinc-950">
      {/* Fundo escuro fixo para não dar barra branca ao rolar */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 pointer-events-none"></div>

      <div className="relative z-10 max-w-3xl w-full my-auto py-10">
        {/* CONTAINER PRINCIPAL DO MODAL - Borda redonda e contorno elegante */}
        <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] p-8 md:p-14 text-center overflow-hidden flex flex-col justify-center min-h-[50vh]">
          
          {/* Gradiente de fundo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 pointer-events-none"></div>
          
          {/* Conteúdo */}
          <div className="relative z-10">
            
            {/* Ícone com brilho */}
            <div className="flex justify-center mb-8 md:mb-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                <div className="relative text-7xl md:text-8xl filter drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                  {protocol === 'male' ? '🦁' : '🐆'}
                </div>
              </div>
            </div>

            {/* Título Minimalista e Impactante */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight leading-tight">
              <span className="text-white">O DESPERTAR </span>
              <span className="text-amber-500 block sm:inline">BIOLÓGICO</span>
            </h1>
            
            {/* Subtítulo Dinâmico */}
            {isLoadingProfile ? (
              <div className="flex flex-col items-center gap-3 mb-10">
                <div className="h-6 w-3/4 bg-zinc-800 rounded-md animate-pulse"></div>
              </div>
            ) : (
              <p className="text-xl md:text-2xl lg:text-3xl font-medium text-zinc-400 mb-10">
                Você está {userGender?.toLowerCase().includes('masculino') || userGender?.toLowerCase().includes('leão') ? 'pronto' : 'pronta'} para assumir o controle?
              </p>
            )}

            {/* Card de Informação */}
            <div className="bg-zinc-950/60 rounded-2xl p-6 md:p-8 mb-10 text-left relative overflow-hidden shadow-inner border border-zinc-800/50">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div> 
              <p className="text-gray-300 leading-relaxed text-base md:text-lg pl-4">
                Nos próximos 21 dias, você executará um protocolo prático de restrição intencional, nutrição ancestral e regulação hormonal. Nós vamos remover a inflamação, dominar o cortisol e <strong className="text-amber-400 font-medium">transformar o seu corpo em uma máquina de alta performance.</strong>
              </p>
            </div>

            {/* Botão Sólido - Sem margem branca e sem borda falhada */}
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
        {/* Header - DARK PREMIUM COM GLASSMORPHISM + LÓGICA DE GÊNERO */}
        <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] border border-white/10 p-6 md:p-8 mb-8 overflow-hidden">
          {/* Gradiente de fundo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mb-2">
                  {protocolData.title}
                </h1>
                <p className="text-gray-400 text-lg">
                  {protocol === 'female' 
                    ? 'Hormônios, Energia e Vitalidade' 
                    : 'Força, Testosterona e Domínio Mental'}
                </p>
              </div>
              <div className="text-5xl filter drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                {protocol === 'male' ? '🦁' : '🐆'}
              </div>
            </div>
            
            {/* Barra de Progresso - GROSSA E IMPACTANTE COM GLOW */}
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

        {/* Timeline de Dias - DARK PREMIUM */}
        <div className="space-y-4">
        {protocolData.days.map((day) => {
            // LÓGICA BLINDADA DE STATUS
            const prevDayCompleted = day.day === 1 || completedDays.includes(day.day - 1);
            const isDayCompleted = completedDays.includes(day.day);
            
            let status = 'locked';
            if (isDayCompleted) {
              status = 'completed';
            } else if (prevDayCompleted) {
              status = 'current';
            }
            const isExpanded = expandedDay === day.day;
            
            // NOVAS REGRAS SEPARADAS: Paywall vs Sequência
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
                      setShowPaywall(true); // Abre a venda SÓ se for bloqueio de pagamento
                    } else if (isSequentiallyLocked) {
                      // Não faz nada, a pessoa tem que terminar o dia anterior
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
                    {/* Box 'Entender a Ciência' - DARK COM BORDA LARANJA */}
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

                    {/* Lista de Tarefas - DARK COM RADIO BUTTON LARANJA */}
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
                                className={`flex items-center gap-3 p-4 rounded-lg transition-all backdrop-blur-md ${
                                  isCompleted
                                    ? 'bg-green-900/30 border-2 border-green-500/60 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                    : 'bg-zinc-800/50 hover:bg-zinc-800/70 border-2 border-zinc-700/50'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
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
                                Benefícios do Jejum
                              </button>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={task.id}
                            onClick={() => toggleTask(day.day, task.id)}
                            className={`w-full flex items-center gap-3 p-4 rounded-lg transition-all backdrop-blur-md ${
                              isCompleted
                                ? 'bg-green-900/30 border-2 border-green-500/60 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                : 'bg-zinc-800/50 hover:bg-zinc-800/70 border-2 border-zinc-700/50'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
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

        {/* Link de Reset Seguro */}
        <button
          onClick={() => setShowResetModal(true)}
          className="w-full py-4 mt-8 text-sm text-zinc-500 hover:text-red-500 underline transition-colors"
        >
          Quebrou o Protocolo? Reiniciar
        </button>
      </div>

      {/* Modal de Reset Seguro */}
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

{/* Modal de Vitória - O GRAND FINALE (Emoji Livre sem Borda) */}
{showVictoryModal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-in fade-in duration-500">
          
          {/* CHUVA DE CONFETES DOURADOS PREMIUM */}
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

          {/* Container Principal */}
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-[0_0_80px_rgba(251,191,36,0.15)] z-50 flex flex-col items-center text-center p-8 md:p-12 [&::-webkit-scrollbar]:hidden scrollbar-hide">
            
            {/* Botão Fechar */}
            <button
              onClick={() => setShowVictoryModal(false)}
              className="absolute top-6 right-6 p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors z-10 border border-zinc-700/50"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-zinc-400 hover:text-white" />
            </button>

            <div className="w-full space-y-6 md:space-y-8 relative z-10 mt-4">
              
              {/* ÍCONE DO ANIMAL (LIVRE, SEM BORDA) */}
              <div className="flex justify-center relative mb-6">
                {/* Luz difusa atrás do emoji para ele não ficar chapado */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/30 blur-[50px] rounded-full"></div>
                {/* O Emoji em si, bem grande */}
                <span className="relative z-10 text-7xl md:text-8xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                  {protocol === 'male' ? '🦁' : '🐆'}
                </span>
              </div>

              {/* TÍTULOS */}
              <div className="flex flex-col gap-3">
                <h1 className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600 font-black text-4xl md:text-5xl tracking-tighter leading-none uppercase drop-shadow-lg">
                  Jornada Dominada
                </h1>
                <h2 className="text-zinc-400 font-bold tracking-[0.2em] text-sm md:text-base uppercase">
                  O Rebanho Ficou Para Trás
                </h2>
              </div>

              {/* Corpo do Texto Premium */}
              <div className="bg-zinc-900/60 rounded-2xl p-6 md:p-8 border border-zinc-800/80 relative text-left shadow-inner mx-auto max-w-sm md:max-w-full mt-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-amber-500 rounded-r-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                <p className="text-zinc-300 font-light tracking-wide leading-relaxed text-sm md:text-base pl-5">
                  Você completou o que <strong className="text-white font-bold">99% iniciam e desistem</strong>. O que antes era sacrifício, hoje é sua natureza. A disciplina deixou de ser uma escolha para se tornar <strong className="text-amber-400 font-medium tracking-wide">QUEM VOCÊ É</strong>. A base foi forjada.
                </p>
              </div>

              {/* Divisor Elegante */}
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent mx-auto"></div>

              {/* Frase de Impacto */}
              <p className="font-serif italic text-zinc-500 text-base md:text-lg">
                "A selva não perdoa. Isso foi apenas o aquecimento."
              </p>

              {/* Botão Nível 2 - Copy de Antecipação e Exclusividade */}
              <button
                onClick={() => alert("ACESSO RESTRITO 🔒\n\nVocê dominou a base e provou o seu valor.\n\nO Nível 2 exigirá ainda mais do seu corpo e mente. As coordenadas desta nova fase estão sendo preparadas exclusivamente para os veteranos que chegaram até aqui.\n\nMantenha seus novos hábitos blindados e aguarde a convocação oficial.")}
                className="w-full relative bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 text-zinc-500 hover:text-amber-500/80 font-black py-5 md:py-6 rounded-2xl text-lg flex items-center justify-center gap-3 mt-8 active:scale-[0.98] uppercase tracking-widest shadow-inner transition-all"
              >
                <Lock className="w-5 h-5" /> ACESSAR NÍVEL 2
              </button>

            </div>
          </div>
        </div>
      )}

     {/* Modal de Benefícios do Jejum - RAIO-X + DOSSIÊ DA SOBREVIVÊNCIA */}
     {showBenefitsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/50 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Cabeçalho Fixo do Modal */}
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

            {/* Área de Rolagem do Conteúdo */}
            <div className="overflow-y-auto p-6 md:p-8 [&::-webkit-scrollbar]:hidden scrollbar-hide flex-1">
              
              {/* LÓGICA DINÂMICA ENTRANDO EM AÇÃO */}
              {(() => {
                const content = getBenefitsContent(currentTaskGoal); 
                return (
                  <div className="flex flex-col items-center mb-10">
                    {/* Círculo da Meta */}
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

                    {/* Linha do Tempo Dinâmica */}
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

              {/* DIVISOR ÉPICO */}
              <div className="flex items-center gap-4 my-8 opacity-60">
                <div className="flex-1 h-px bg-zinc-800"></div>
                <Info className="w-4 h-4 text-zinc-500" />
                <div className="flex-1 h-px bg-zinc-800"></div>
              </div>

              {/* A CIÊNCIA DO BRANDINI - "Dossiê" */}
              <div className="space-y-6">
                <h3 className="text-amber-500 font-black text-lg uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5" /> A Mecânica Ancestral
                </h3>

                {/* Card 1: Grelina e Leptina */}
                <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-5">
                  <h4 className="text-white font-bold text-sm uppercase mb-2">A Ilusão da Fome</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">
                    O corpo é como uma criança exigindo comida. Esse sinal chama-se <strong className="text-amber-500/80 font-medium">Grelina</strong>. Ao resistir às primeiras horas, ela despenca. Você descobre que a dor no estômago era apenas um alerta falso do sistema, não risco de morte.
                  </p>
                </div>

                {/* Card 2: Queima Inteligente */}
                <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-5 border-l-2 border-l-amber-500">
                  <h4 className="text-white font-bold text-sm uppercase mb-2">Preservação Muscular</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">
                    Por que queimar o açúcar primeiro? Porque é fácil. Quando ele acaba, o fígado escolhe. Se você não usar os músculos, ele os queima. Se você treina, ele <strong className="text-amber-500/80 font-medium">protege a massa muscular</strong> e passa a derreter gordura pura como combustível primário.
                  </p>
                </div>

                {/* Card 3: Cérebro e Evolução (BDNF & GH) */}
                <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-5">
                  <h4 className="text-white font-bold text-sm uppercase mb-2">Sobrevivência do Mais Forte</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">
                    No jejum longo, o corpo aumenta a produção de <strong className="text-amber-500/80 font-medium">BDNF</strong> (criando novos neurônios) e o <strong className="text-amber-500/80 font-medium">Hormônio do Crescimento (GH)</strong> vai ao teto. O código biológico entende: <span className="italic text-zinc-500">"Se esse cara não ficar mais inteligente e maior agora, ele morre e não reproduz."</span>
                  </p>
                </div>

                {/* Card de Regra Prática (Sal e Água) */}
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

           {/* Botão Inferior Fixo */}
           <div className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0">
              <button
                onClick={() => {
                  // 1. Ação Imediata: Fecha o modal na hora para o usuário não perceber nada
                  setShowBenefitsModal(false);

                  // 2. Tiro com Silenciador: Avisa o nosso Quartel-General para agendar o Push
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

      {/* --- ADICIONE O PAYWALL AQUI --- */}
      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        userId={user?.id || ''} 
      />

      {/* Espaçador para evitar corte pela Navbar */}
      <div className="h-32"></div>
    </div>
  );
}