'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JOURNEY_DATA } from '@/lib/journeyData';
import { CheckCircle2, Circle, Lock, ChevronDown, ChevronUp, Info, X, Trophy, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Protocol = 'male' | 'female' | null;

interface FastingTimer {
  startTime: number;
  goalHours: number;
}

export default function JornadaPage() {
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

  // Toggle de tarefa e inserção no banco - CORRIGIDO COM RECÁLCULO ESTRITO
  async function toggleTask(dayNum: number, taskId: string) {
    if (dayNum > currentDay || !userId) return;

    const taskKey = `day${dayNum}_${taskId}`;
    const isCurrentlyCompleted = completedTasks[taskKey];
    const newCompleted = { ...completedTasks, [taskKey]: !isCurrentlyCompleted };
    setCompletedTasks(newCompleted);

    // Verificar se todas as tarefas do dia foram completadas
    const protocolData = protocol ? JOURNEY_DATA[protocol] : null;
    if (!protocolData) return;

    const currentDayData = protocolData.days.find(d => d.day === dayNum);
    if (!currentDayData) return;

    // RECÁLCULO ESTRITO: Verificar se TODAS as tarefas estão marcadas
    const allTasksCompleted = currentDayData.tasks.every(task => {
      const key = `day${dayNum}_${task.id}`;
      return newCompleted[key] === true;
    });

    // LÓGICA CORRIGIDA: Recalcular status do dia em TODA interação
    if (allTasksCompleted && !completedDays.includes(dayNum)) {
      // TODAS as tarefas completadas E dia ainda não estava marcado como concluído
      try {
        // Inserir na tabela jornada_logs
        await supabase
          .from('jornada_logs')
          .insert({
            user_id: userId,
            day_number: dayNum,
            completed_at: new Date().toISOString(),
          });

        // Atualizar estado local
        const newCompletedDays = [...completedDays, dayNum];
        setCompletedDays(newCompletedDays);

        // Atualizar localStorage para a Home
        localStorage.setItem('primal_progress_days', newCompletedDays.length.toString());

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

        // Atualizar localStorage para a Home
        localStorage.setItem('primal_progress_days', newCompletedDays.length.toString());

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

  // Tela de Introdução (Onboarding) - DARK MODE PREMIUM COM SKELETON
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4 pb-32">
        <div className="max-w-2xl w-full">
          {/* Container Glassmorphism */}
          <div className="relative backdrop-blur-xl bg-white/5 rounded-[32px] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] border border-white/10 p-8 md:p-12 text-center overflow-hidden">
            {/* Gradiente de fundo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
            
            {/* Conteúdo */}
            <div className="relative z-10">
              {/* Ícone com brilho */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative text-7xl filter drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                    {protocol === 'male' ? '🦁' : '🐆'}
                  </div>
                </div>
              </div>
              
              {/* Título com gradiente */}
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  O Protocolo de 21 Dias vai{' '}
                </span>
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent animate-pulse">
                  Resetar
                </span>
                <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  {' '}seu corpo e mente
                </span>
              </h1>
              
              {/* Subtítulo com lógica de gênero CORRIGIDA + SKELETON */}
              {isLoadingProfile ? (
                <div className="flex flex-col items-center gap-3 mb-10">
                  <div className="h-8 w-3/4 bg-gray-700/50 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-1/2 bg-gray-700/50 rounded-lg animate-pulse"></div>
                </div>
              ) : (
                <p className="text-2xl md:text-3xl font-semibold text-gray-300 mb-10 leading-relaxed">
                  Você está {userGender?.toLowerCase().includes('masculino') || userGender?.toLowerCase().includes('leão') ? 'pronto' : 'pronta'} para assumir o{' '}
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent font-bold">
                    Controle
                  </span>
                  ?
                </p>
              )}

              {/* Card de informação */}
              <div className="backdrop-blur-md bg-white/5 rounded-2xl p-6 mb-10 border border-white/10">
                <p className="text-gray-300 leading-relaxed text-lg">
                  Durante os próximos 21 dias, você seguirá um protocolo científico 
                  baseado em jejum intermitente, nutrição ancestral e hábitos que 
                  transformarão sua energia, foco e composição corporal.
                </p>
              </div>

              {/* Botão de ação com gradiente e sombra */}
              <button
                onClick={handleStartChallenge}
                disabled={isLoadingProfile}
                className="group relative w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 text-black font-bold text-xl py-6 px-8 rounded-2xl shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:shadow-[0_0_60px_rgba(251,191,36,0.5)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 tracking-wide">
                  {isLoadingProfile ? 'CARREGANDO...' : 'COMEÇAR O DESAFIO'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
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
            const status = getDayStatus(day.day);
            const isExpanded = expandedDay === day.day;
            const isLocked = status === 'locked';

            const allTasksCompleted = day.tasks.every(task => {
              const taskKey = `day${day.day}_${task.id}`;
              return completedTasks[taskKey];
            });

            const isDay21Complete = day.day === 21 && completedDays.includes(21);

            return (
              <div
                key={day.day}
                className={`backdrop-blur-xl bg-zinc-900/80 rounded-xl shadow-lg overflow-hidden transition-all duration-300 border ${
                  status === 'completed' 
                    ? 'border-amber-500/60 shadow-[0_0_20px_rgba(251,191,36,0.3)]' 
                    : status === 'current' && allTasksCompleted
                    ? 'border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.4)] animate-pulse' 
                    : status === 'current' 
                    ? 'border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.4)] animate-[pulse_2s_ease-in-out_infinite]' 
                    : 'border-zinc-800/50'
                } ${isLocked ? 'opacity-50' : ''}`}
              >
                <button
                  onClick={() => !isLocked && setExpandedDay(isExpanded ? null : day.day)}
                  disabled={isLocked}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    {(status === 'completed' || isDay21Complete) && (
                      <CheckCircle2 className="w-8 h-8 text-amber-500 flex-shrink-0 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                    )}
                    {status === 'current' && !allTasksCompleted && (
                      <Circle className="w-8 h-8 text-orange-500 flex-shrink-0 drop-shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
                    )}
                    {status === 'locked' && (
                      <Lock className="w-8 h-8 text-zinc-600 flex-shrink-0" />
                    )}
                    
                    <div className="text-left">
                      <div className="text-sm text-gray-500 font-medium">Dia {day.day}</div>
                      <div className="text-xl font-bold text-gray-100">{day.title}</div>
                    </div>
                  </div>

                  {!isLocked && (
                    <div>
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  )}
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

      {/* Modal de Vitória */}
      {showVictoryModal && (
        <div className="fixed inset-0 bg-black/90 flex items-end justify-center z-50 backdrop-blur-sm">
          <div className="fixed bottom-4 left-4 right-4 max-h-[80vh] overflow-y-auto bg-zinc-950 rounded-[35px] shadow-[0_0_50px_-10px_rgba(234,179,8,0.3)] z-50 flex flex-col items-center text-center p-6 pb-24 [&::-webkit-scrollbar]:hidden scrollbar-hide">
            <button
              onClick={() => setShowVictoryModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-zinc-800/50 rounded-full transition-colors z-10"
              aria-label="Fechar"
            >
              <X className="w-6 h-6 text-zinc-400 hover:text-white" />
            </button>

            <div className="w-full max-w-2xl space-y-8">
              <div className="flex justify-center mt-4">
                <div className="relative">
                  <Trophy className="w-14 h-14 text-yellow-500 animate-pulse" />
                  <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-1 -right-1 animate-bounce" />
                </div>
              </div>

              <h2 className="text-yellow-500 font-bold tracking-[0.2em] text-lg uppercase">
                JORNADA DOMINADA {protocol === 'male' ? '🦁' : '🐆'}
              </h2>

              <h1 className="text-white font-extrabold text-3xl tracking-tight leading-none">
                O REBANHO FICOU PARA TRÁS.
              </h1>

              <p className="text-zinc-300 font-light tracking-wide leading-relaxed text-lg max-w-[280px] mx-auto">
                Você completou o que 99% iniciam e desistem. O que antes era sacrifício, hoje é sua natureza. A disciplina deixou de ser uma escolha para se tornar quem você é. A base foi forjada.
              </p>

              <div className="w-12 h-1 bg-zinc-800 rounded-full my-8 mx-auto"></div>

              <p className="font-serif italic text-yellow-500 text-base">
                A selva não perdoa. Isso foi apenas o aquecimento.
              </p>

              <button
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-2xl shadow-lg shadow-yellow-500/50 text-lg flex items-center justify-center gap-2 mt-8 cursor-not-allowed opacity-75 active:scale-95 transition-transform duration-100"
                disabled
              >
                ACESSAR NÍVEL 2 🔒
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Benefícios do Jejum - RAIO-X DINÂMICO */}
      {showBenefitsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="backdrop-blur-xl bg-zinc-900/95 border border-zinc-800/50 rounded-2xl p-8 max-w-md w-full shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBenefitsModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-800/50 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X className="w-6 h-6 text-zinc-400 hover:text-white" />
            </button>

            <div className="text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                {getBenefitsContent(currentTaskGoal).title}
              </h2>
              
              <div className="my-8">
                <div className="relative w-48 h-48 mx-auto">
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="#27272a"
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      className="stroke-amber-500"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray="553"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold text-gray-100">
                      {getBenefitsContent(currentTaskGoal).ring}h
                    </div>
                    <div className="text-sm text-gray-400">
                      Meta
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-left space-y-4 mb-6">
                {getBenefitsContent(currentTaskGoal).timeline.map((phase, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
                    <span className="text-2xl flex-shrink-0">{phase.icon}</span>
                    <div>
                      <div className="font-semibold text-amber-400 text-sm">{phase.time}</div>
                      <div className="text-gray-300 text-sm">{phase.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowBenefitsModal(false)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)]"
              >
                Entendi
              </button>

              {/* Espaçador para evitar corte pela Navbar */}
              <div className="h-32"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
