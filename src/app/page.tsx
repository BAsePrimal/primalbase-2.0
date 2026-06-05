'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sun, Moon, ChefHat, Brain, User, Flame, Droplet, Droplets, X, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CompleteProfileGate from '@/components/CompleteProfileGate';
import Rastreador from '@/components/Rastreador';
import BannerRadar from '@/components/BannerRadar';
import WaterTracker from '@/components/WaterTracker';

interface Profile {
  full_name: string;
  gender: string;
  current_weight: number;
  height: number;
  goal: string;
  level: number;
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [diasFeitos, setDiasFeitos] = useState(0);
  
  const [aguaConsumida, setAguaConsumida] = useState(0);
  const [showOtimizacao, setShowOtimizacao] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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

  function getGreeting() {
    const hour = new Date().getHours();
    const firstName = profile?.full_name?.split(' ')[0] || 'Guerreiro';
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

      <main className="flex-1 px-6 py-6 space-y-5">
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

        {/* 👇 CARD DE ÁGUA - COMPACTO E AZUL FIRME 👇 */}
        {!showOtimizacao ? (
          <div 
            onClick={() => setShowOtimizacao(true)}
            className={`bg-zinc-900 border rounded-2xl p-5 cursor-pointer transition-all duration-300 ${
              isWaterGoalReached ? 'border-blue-900/50 shadow-[0_0_20px_rgba(59,130,246,0.1)] flex justify-center items-center gap-3' : 'border-zinc-800 hover:border-blue-500/50 flex items-center gap-4'
            }`}
          >
            {isWaterGoalReached ? (
              // Layout quando bate a meta: Centralizado, Ícone Azul Gota Preenchida, texto estilo iPhone
              <>
                <Droplet className="w-7 h-7 text-blue-500 fill-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.4)]" />
                <h3 className="text-base font-semibold tracking-wide text-blue-400">
                  Meta Diária Concluída
                </h3>
              </>
            ) : (
              // Layout antes da meta: Padrão
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
          <div className={`bg-zinc-900 border rounded-2xl p-5 space-y-3 animate-in fade-in zoom-in duration-300 ${
            isWaterGoalReached ? 'border-blue-500/50' : 'border-zinc-800'
          }`}>
             <div className="flex justify-between items-center pb-1">
               <h3 className={`text-sm font-medium tracking-tight flex items-center gap-2 ${isWaterGoalReached ? 'text-blue-400' : 'text-zinc-400'}`}>
                 <Droplet className={`w-4 h-4 ${isWaterGoalReached ? 'text-blue-400 fill-blue-400/30' : 'text-blue-500'}`} />
                 Consumo de Água
               </h3>
               <button 
                 onClick={() => setShowOtimizacao(false)} 
                 className="p-1 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             <WaterTracker currentValue={aguaConsumida} goal={metaAgua} onAdd={handleAddWater} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/chef-ia">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all duration-300 cursor-pointer group">
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all duration-300 cursor-pointer group">
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
            <Link href="/jornada" className={`${isCompleted ? 'text-yellow-500 hover:text-yellow-400' : 'text-amber-500 hover:text-amber-400'} font-medium text-xs mt-2 inline-block`}>{isCompleted ? 'Ver Conquistas →' : 'Continuar Jornada →'}</Link>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center"><Flame className="w-7 h-7 text-orange-500" /></div>
              <div>
                <h3 className="text-lg font-semibold text-orange-500">Desafio 21 Dias</h3>
                <p className="text-xs text-zinc-400 mt-1">Transforme sua vida com hábitos ancestrais</p>
              </div>
              <Link href="/jornada" className="w-full mt-2"><button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-semibold py-2.5 px-6 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-300">Começar Desafio</button></Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}