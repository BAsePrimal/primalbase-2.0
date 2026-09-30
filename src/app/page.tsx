'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { Sun, Moon, ChefHat, Brain, User, Flame, Droplet, X, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CompleteProfileGate from '@/components/CompleteProfileGate';
import Rastreador from '@/components/Rastreador';
import BannerRadar from '@/components/BannerRadar';
import WaterTracker from '@/components/WaterTracker';

const TOUR_STEPS = [
  { id: 'tour-agua', title: 'Hidratação', text: 'Registre o seu consumo. O app vai calcular a sua meta e enviar lembretes para você não esquecer de beber água.' },
  { id: 'tour-chef', title: 'Chef IA', text: 'Sem ideias para o jantar? Diga o que tem na geladeira e o Chef monta o seu prato na hora.' },
  { id: 'tour-especialista', title: 'Especialista', text: 'Sem adivinhações. Ficou com alguma dúvida sobre a dieta? O especialista responde na hora.' },
  { id: 'tour-nutricao', title: 'Sua Base', text: 'O seu cardápio da semana, check-list diário e controle de suplementos ficam aqui.' },
  { id: 'tour-scanner', title: 'Raio-X', text: 'Aponte a câmera para qualquer alimento ou rótulo e descubra na hora se é lixo ou comida de verdade.' },
  { id: 'tour-jornada', title: 'Progresso', text: 'Acompanhe a sua evolução diária para manter a consistência. Tudo pronto?' }
];

const TourGuiado = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    let mounted = true;
    
    const updateRect = () => {
      const el = document.getElementById(TOUR_STEPS[currentStep].id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (mounted) setRect(el.getBoundingClientRect());
        }, 300); 
      }
    };
    
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => {
      mounted = false;
      window.removeEventListener('resize', updateRect);
    };
  }, [currentStep]);

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isBottomHalf = rect ? rect.top > windowSize.h / 2 : false;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden pointer-events-auto">
      
      {rect && (
        <div
          className="absolute transition-all duration-500 ease-in-out pointer-events-none rounded-2xl bg-transparent"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.85), 0 0 30px 5px rgba(245,158,11,0.3)',
            border: '2px solid rgba(245,158,11,0.8)',
          }}
        />
      )}

      {rect && (
        <div
          className="absolute z-[202] w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent transition-all duration-500 pointer-events-none"
          style={{
            left: rect.left + rect.width / 2,
            transform: 'translateX(-50%)',
            ...(isBottomHalf
              ? {
                  bottom: windowSize.h - rect.top + 4,
                  borderTop: '12px solid rgb(245, 158, 11)'
                }
              : {
                  top: rect.bottom + 4,
                  borderBottom: '12px solid rgb(245, 158, 11)'
                }
            )
          }}
        />
      )}

      {rect && (
        <div
          className="absolute z-[201] w-[90%] max-w-sm bg-zinc-900 border border-amber-500/50 p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500"
          style={{
            ...(isBottomHalf
              ? { bottom: windowSize.h - rect.top + 16 }
              : { top: rect.bottom + 16 }
            ),
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-xs shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.4)]">
              {currentStep + 1}/6
            </div>
            <h3 className="text-amber-500 font-black text-lg uppercase tracking-tight">{step.title}</h3>
          </div>
          
          <p className="text-zinc-300 text-sm leading-relaxed mb-5 font-medium">{step.text}</p>
          
          <button
            onClick={() => {
              if (isLast) onComplete();
              else setCurrentStep(s => s + 1);
            }}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black py-3.5 rounded-xl uppercase text-sm tracking-widest active:scale-95 transition-transform"
          >
            {isLast ? 'FINALIZAR TOUR' : 'Próximo Passo'}
          </button>
        </div>
      )}
    </div>
  );
};

interface Profile {
  full_name: string;
  gender: string;
  current_weight: number;
  height: number;
  goal: string;
  level: number;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [showTour, setShowTour] = useState(() => searchParams.get('tour') === 'start');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [diasFeitos, setDiasFeitos] = useState(0);
  const [aguaConsumida, setAguaConsumida] = useState(0);
  const [showOtimizacao, setShowOtimizacao] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [ticketDourado, setTicketDourado] = useState<string | null>(null);

  // Bloqueador do prompt nativo de instalação do navegador durante o tour
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      if (showTour) e.preventDefault();
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [showTour]);

  useEffect(() => {
    const successParam = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    if (successParam === 'true') {
      setShowSuccessModal(true);
      if (sessionId) setTicketDourado(sessionId);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

    if (!showTour && successParam !== 'true') {
      const visits = parseInt(localStorage.getItem('primalbase_visits') || '0');
      const newVisits = visits + 1;
      localStorage.setItem('primalbase_visits', newVisits.toString());
      
      const hasSeenTour = localStorage.getItem('primalbase_has_seen_tour') === 'true';
      const alreadyPromptedSession = sessionStorage.getItem('pwa_prompted') === 'true';
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

      // 👇 GATILHO NA 3ª VISITA EXATA
      if (hasSeenTour && newVisits === 3 && !isPWA && !alreadyPromptedSession) {
        setTimeout(() => {
          window.dispatchEvent(new Event('forceInstallModal'));
          sessionStorage.setItem('pwa_prompted', 'true');
        }, 3000);
      }
    }
  }, [showTour, searchParams]);

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const isVisitorQuery = searchParams.get('visitante') === 'true' || window.location.search.includes('visitante=true');
        const isSuccess = searchParams.get('success') === 'true';
        const isVisitorLocal = localStorage.getItem('primalbase_visitor') === 'true';

        if (isVisitorQuery) {
          localStorage.setItem('primalbase_visitor', 'true');
        }

        const isVisitor = isVisitorQuery || isVisitorLocal;

        if (!isVisitor && !isSuccess) {
          router.replace('/login');
          return; 
        }
        setLoading(false);
        return; 
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profileData) setProfile(profileData);

      const { data: jornadaData } = await supabase.from('jornada_logs').select('day_number').eq('user_id', session.user.id).eq('status', 'concluido');
      if (jornadaData) setDiasFeitos(jornadaData.length);

      const today = new Date().toISOString().split('T')[0];
      const { data: habitosData, error: habitosError } = await supabase.from('historico_habitos').select('agua_ml').eq('user_id', session.user.id).eq('data_registro', today).single();

      if (habitosData) {
        setAguaConsumida(habitosData.agua_ml || 0);
      } else if (habitosError?.code === 'PGRST116') {
        await supabase.from('historico_habitos').insert([{ user_id: session.user.id, data_registro: today, agua_ml: 0 }]);
      }

    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddWater = async (quantidade: number) => {
    const novoValor = aguaConsumida + quantidade;
    setAguaConsumida(novoValor);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('historico_habitos').update({ agua_ml: novoValor }).eq('user_id', session.user.id).eq('data_registro', today);
  };

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('primalbase_has_seen_tour', 'true');
    window.history.replaceState(null, '', '/?visitante=true');
    
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    // 👇 GATILHO IMEDIATO APÓS O FIM DO TOUR
    if (!isPWA) {
      setTimeout(() => {
        window.dispatchEvent(new Event('forceInstallModal'));
        sessionStorage.setItem('pwa_prompted', 'true');
      }, 500);
    }
  };

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function getGreetingIcon() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) return <Sun className="w-7 h-7 text-amber-500" />;
    return <Moon className="w-7 h-7 text-amber-500" />;
  }

  function getSubtitle() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Manhã: Foco e Caça';
    if (hour >= 12 && hour < 18) return 'Tarde: Força e Construção';
    return 'Noite: Recuperação e Sono';
  }

  const isCompleted = diasFeitos >= 21;
  const metaAgua = profile?.current_weight ? profile.current_weight * 40 : 2500;
  const isWaterGoalReached = aguaConsumida >= metaAgua;

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div></div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col pb-20">
      
      {showTour && <TourGuiado onComplete={handleTourComplete} />}
      
      <CompleteProfileGate />
      <Rastreador />

      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <img src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/612876e9-e369-433d-a381-d02938696ed1.png" alt="PrimalBase" className="h-20 w-auto" style={{ imageRendering: 'crisp-edges' }} />
        <Link href="/perfil">
          <button className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
            <User className="w-5 h-5 text-zinc-400" />
          </button>
        </Link>
      </header>

      <main className="flex-1 px-6 py-6 space-y-5 relative">
        <BannerRadar />

        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              {getGreetingIcon()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-amber-500">{getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Guerreiro'}</h2>
              <p className="text-sm text-zinc-400 mt-0.5">{getSubtitle()}</p>
            </div>
          </div>
        </div>

        {!showOtimizacao ? (
          <div 
            id="tour-agua"
            onClick={() => setShowOtimizacao(true)}
            className={`bg-zinc-900 border rounded-2xl p-5 cursor-pointer transition-all duration-300 ${
              isWaterGoalReached ? 'border-blue-900/50 shadow-[0_0_20px_rgba(59,130,246,0.1)] flex justify-center items-center gap-3' : 'border-zinc-800 hover:border-blue-500/50 flex items-center gap-4'
            }`}
          >
            {isWaterGoalReached ? (
              <>
                <Droplet className="w-7 h-7 text-blue-500 fill-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.4)]" />
                <h3 className="text-base font-semibold tracking-wide text-blue-400">Meta Diária Concluída</h3>
              </>
            ) : (
              <>
                <Droplet className="w-8 h-8 flex-shrink-0 text-blue-500 transition-colors" />
                <div>
                   <h3 className="text-lg font-semibold text-zinc-50">Água</h3>
                   <p className="text-sm text-zinc-500 mt-1">Registre seu consumo</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={`bg-zinc-900 border rounded-2xl p-5 space-y-3 animate-in fade-in zoom-in duration-300 ${isWaterGoalReached ? 'border-blue-500/50' : 'border-zinc-800'}`}>
             <div className="flex justify-between items-center pb-1">
               <h3 className={`text-sm font-medium tracking-tight flex items-center gap-2 ${isWaterGoalReached ? 'text-blue-400' : 'text-zinc-400'}`}>
                 <Droplet className={`w-4 h-4 ${isWaterGoalReached ? 'text-blue-400 fill-blue-400/30' : 'text-blue-500'}`} />
                 Consumo de Água
               </h3>
               <button onClick={() => setShowOtimizacao(false)} className="p-1 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
             </div>
             <WaterTracker currentValue={aguaConsumida} goal={metaAgua} onAdd={handleAddWater} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/chef-ia">
            <div id="tour-chef" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all duration-300 cursor-pointer group h-full">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <ChefHat className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-50">Chef Criativo</h3>
                  <p className="text-xs text-zinc-500 mt-1">Gere receitas com o que você tem</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/chat-ia">
            <div id="tour-especialista" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all duration-300 cursor-pointer group h-full">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Brain className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-50">Especialista IA</h3>
                  <p className="text-xs text-zinc-500 mt-1">Tire dúvidas sobre sua dieta</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {diasFeitos > 0 ? (
          <div className={`bg-gradient-to-br ${isCompleted ? 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30' : 'from-orange-500/20 to-red-500/10 border-orange-500/30'} border rounded-2xl p-5 shadow-lg space-y-3`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${isCompleted ? 'bg-yellow-500/20' : 'bg-orange-500/20'} flex items-center justify-center`}>
                {isCompleted ? <Trophy className="w-6 h-6 text-yellow-500" /> : <Flame className="w-6 h-6 text-orange-500" />}
              </div>
              <div>
                <h3 className={`text-base font-semibold ${isCompleted ? 'text-yellow-500' : 'text-orange-500'}`}>Desafio 21 Dias</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{isCompleted ? 'Parabéns! Você completou o desafio!' : 'Transforme sua vida com hábitos ancestrais'}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <p className="text-white font-bold text-[10px] uppercase">{isCompleted ? '✨ Nível 1 Completo' : `Dia ${diasFeitos} de 21`}</p>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
              <div className={`${isCompleted ? 'bg-gradient-to-r from-yellow-500 to-amber-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]' : 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'} h-full transition-all duration-500 rounded-full`} style={{ width: `${Math.min((diasFeitos / 21) * 100, 100)}%` }}></div>
            </div>
            <Link href="/jornada" className={`${isCompleted ? 'text-yellow-500 hover:text-yellow-400' : 'text-amber-500 hover:text-amber-400'} font-medium text-xs mt-2 inline-block`}>
              {isCompleted ? 'Ver Conquistas →' : 'Continuar Jornada →'}
            </Link>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center"><Flame className="w-7 h-7 text-orange-500" /></div>
              <div>
                <h3 className="text-lg font-semibold text-orange-500">Desafio 21 Dias</h3>
                <p className="text-xs text-zinc-400 mt-1">Transforme sua vida com hábitos ancestrais</p>
              </div>
              <Link href="/jornada" className="w-full mt-2">
                <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-semibold py-2.5 px-6 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-300">
                  Começar Desafio
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE SUCESSO */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.15)] transform scale-100 animate-in zoom-in-95 duration-300">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-xl flex items-center justify-center">
              <span className="text-4xl">🔥</span>
            </div>
            <h2 className="mt-8 text-3xl font-black text-white uppercase tracking-tight leading-tight">
              Protocolo <br/> <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Desbloqueado!</span>
            </h2>
            <p className="mt-4 text-zinc-400 text-sm md:text-base leading-relaxed font-medium">
              O seu período de teste no <strong className="text-white">Primal Base</strong> foi ativado. Você agora tem acesso sem restrições a todas as ferramentas VIP.
            </p>
            <div className="mt-8">
            <button 
                onClick={() => router.push(ticketDourado ? `/finalizar-cadastro?session_id=${ticketDourado}` : '/finalizar-cadastro')}
                className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-zinc-950 font-black uppercase tracking-widest text-sm rounded-xl transition-all transform active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                CRIAR CONTA PREMIUM
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}