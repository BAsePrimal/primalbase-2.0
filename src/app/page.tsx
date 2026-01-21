'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sun, Moon, ChefHat, Brain, User, Flame, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Profile {
  full_name: string;
  gender: string;
  current_weight: number;
  height: number;
  goal: string;
  level: number;
}

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [diasFeitos, setDiasFeitos] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('primal_progress_days');
    if (saved) setDiasFeitos(parseInt(saved));
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Buscar perfil na tabela profiles
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  }

  function getGreeting() {
    const hour = new Date().getHours();
    const firstName = profile?.full_name.split(' ')[0] || 'Guerreiro';
    
    let greeting = '';
    if (hour >= 5 && hour < 12) {
      greeting = 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
      greeting = 'Boa tarde';
    } else {
      greeting = 'Boa noite';
    }

    if (profile?.gender === 'Feminino') {
      return `${greeting}, ${firstName}`;
    }
    
    return `${greeting}, ${firstName}`;
  }

  function getGreetingIcon() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      return <Sun className="w-7 h-7 text-amber-500" />;
    }
    return <Moon className="w-7 h-7 text-amber-500" />;
  }

  function getSubtitle() {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Manhã: Foco e Caça';
    } else if (hour >= 12 && hour < 18) {
      return 'Tarde: Força e Construção';
    } else {
      return 'Noite: Recuperação e Sono';
    }
  }

  // Verificar se o desafio foi concluído
  const isCompleted = diasFeitos >= 21;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <img 
          src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/612876e9-e369-433d-a381-d02938696ed1.png" 
          alt="PrimalBase" 
          className="h-20 w-auto" 
          style={{ imageRendering: 'crisp-edges' }}
        />
        <Link href="/perfil">
          <button className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
            <User className="w-5 h-5 text-zinc-400" />
          </button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Saudação Dinâmica */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              {getGreetingIcon()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-amber-500">{getGreeting()}</h2>
              <p className="text-sm text-zinc-400 mt-1">{getSubtitle()}</p>
            </div>
          </div>
        </div>

        {/* Cards de IA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card Chef Criativo */}
          <Link href="/chef-ia">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all duration-300 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <ChefHat className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-50">Chef Criativo</h3>
                  <p className="text-sm text-zinc-500 mt-1">Gere receitas com o que você tem</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Card Especialista IA */}
          <Link href="/chat-ia">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all duration-300 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Brain className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-50">Especialista IA</h3>
                  <p className="text-sm text-zinc-500 mt-1">Tire dúvidas sobre sua dieta</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Área de Progresso do Desafio */}
        {diasFeitos > 0 ? (
          <div className={`bg-gradient-to-br ${isCompleted ? 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30' : 'from-orange-500/20 to-red-500/10 border-orange-500/30'} border rounded-2xl p-6 shadow-lg space-y-4`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${isCompleted ? 'bg-yellow-500/20' : 'bg-orange-500/20'} flex items-center justify-center`}>
                {isCompleted ? (
                  <Trophy className="w-7 h-7 text-yellow-500" />
                ) : (
                  <Flame className="w-7 h-7 text-orange-500" />
                )}
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isCompleted ? 'text-yellow-500' : 'text-orange-500'}`}>
                  Desafio 21 Dias
                </h3>
                <p className="text-sm text-zinc-400">
                  {isCompleted ? 'Parabéns! Você completou o desafio!' : 'Transforme sua vida com hábitos ancestrais'}
                </p>
              </div>
            </div>
            
            {/* Texto de Status */}
            <div className="flex justify-end">
              <p className="text-white font-bold text-sm">
                {isCompleted ? '✨ Nível 1 Completo' : `Dia ${diasFeitos} de 21`}
              </p>
            </div>
            
            {/* Barra de Progresso com Brilho */}
            <div className="w-full bg-zinc-800 rounded-full h-5 overflow-hidden">
              <div 
                className={`${isCompleted ? 'bg-gradient-to-r from-yellow-500 to-amber-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]' : 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'} h-full transition-all duration-500 rounded-full`}
                style={{ width: `${Math.min((diasFeitos / 21) * 100, 100)}%` }}
              ></div>
            </div>
            
            {/* Link Discreto */}
            <Link href="/jornada" className={`${isCompleted ? 'text-yellow-500 hover:text-yellow-400' : 'text-amber-500 hover:text-amber-400'} font-medium text-sm mt-4 inline-block`}>
              {isCompleted ? 'Ver Conquistas →' : 'Continuar Jornada →'}
            </Link>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-orange-500">Desafio 21 Dias</h3>
                <p className="text-sm text-zinc-400 mt-2">
                  Transforme sua vida com hábitos ancestrais
                </p>
              </div>
              <Link href="/jornada" className="w-full">
                <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-semibold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300">
                  Começar Desafio
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
