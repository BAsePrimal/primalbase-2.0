'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, BookOpen, Apple, ChefHat, AlertCircle, CheckCircle2, TriangleAlert, Lock } from 'lucide-react';
import PaywallModal from '@/components/PaywallModal'; // IMPORT DO SEU POP-UP VIP

export default function GuidePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'alimentos' | 'receitas'>('alimentos');
  const [statusFilter, setStatusFilter] = useState<'all' | 'allowed' | 'moderate' | 'banned'>('allowed'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DO PAYWALL ---
  const [user, setUser] = useState<any>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // --- VERIFICAÇÃO DE USUÁRIO E BUSCA DE ALIMENTOS ---
  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Verifica Assinatura
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

        // 2. Busca Alimentos
        const { data: foodsData, error } = await supabase
          .from('foods')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setFoods(foodsData || []);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredFoods = foods.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    if (status === 'allowed') return 'text-green-500 border-green-900/30 bg-green-900/10';
    if (status === 'moderate') return 'text-yellow-500 border-yellow-900/30 bg-yellow-900/10';
    return 'text-red-500 border-red-900/30 bg-red-900/10'; 
  };

  const getStatusIcon = (status: string) => {
    if (status === 'allowed') return <CheckCircle2 size={18} />;
    if (status === 'moderate') return <TriangleAlert size={18} />;
    return <AlertCircle size={18} />; 
  };

  const translateStatus = (status: string) => {
    if (status === 'allowed') return 'PERMITIDO';
    if (status === 'moderate') return 'MODERADO';
    if (status === 'banned') return 'PROIBIDO';
    return status.toUpperCase();
  };

  const handleReceitasClick = () => {
    router.push('/recipes'); // Se receitas não for assinante, a trava deve estar lá na página de receitas
  };

  // Trava para a barra de pesquisa
  const handleSearchClick = () => {
    if (!isSubscriber) {
      setShowPaywall(true);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 pb-28 font-sans">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-amber-500 flex items-center gap-2">
          <BookOpen /> Guia de Alimentos
        </h1>
      </header>

      {/* Barra de Busca (Bloqueada para não assinantes) */}
      <div className="relative mb-4" onClick={handleSearchClick}>
        <Search className="absolute left-3 top-3 text-zinc-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar alimento..." 
          value={searchTerm}
          onChange={(e) => isSubscriber && setSearchTerm(e.target.value)}
          readOnly={!isSubscriber}
          className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 transition-all focus:outline-none focus:border-amber-500 ${!isSubscriber ? 'text-zinc-500 cursor-pointer' : 'text-zinc-200'}`}
        />
        {!isSubscriber && <Lock size={16} className="absolute right-4 top-3.5 text-amber-500/50" />}
      </div>

      {/* Abas Principais */}
      <div className="flex bg-zinc-900 p-1 rounded-xl mb-6 border border-zinc-800">
        <button 
          onClick={() => setActiveTab('alimentos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'alimentos' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Apple size={16} /> Alimentos
        </button>
        <button 
          onClick={handleReceitasClick}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-zinc-500 hover:text-zinc-300 transition-all"
        >
          <ChefHat size={16} /> Receitas
        </button>
      </div>

      {/* Conteúdo: Alimentos */}
      {activeTab === 'alimentos' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => setStatusFilter('allowed')} 
              className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-bold border transition-all ${statusFilter === 'allowed' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
            >
              ✅ Permitidos
            </button>
            <button 
              onClick={() => setStatusFilter('moderate')} 
              className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-bold border transition-all ${statusFilter === 'moderate' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
            >
              ⚠️ Moderados
            </button>
            <button 
              onClick={() => setStatusFilter('banned')} 
              className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-bold border transition-all ${statusFilter === 'banned' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
            >
              🚫 Proibidos
            </button>
            <button 
              onClick={() => setStatusFilter('all')} 
              className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-bold border transition-all ${statusFilter === 'all' ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
            >
              Todos
            </button>
          </div>

          {/* Lista de Alimentos com Lógica Freemium (Efeito Vitrine) */}
          <div className="space-y-2 relative">
            {loading ? (
               <div className="text-center py-10 text-zinc-500 animate-pulse">Carregando enciclopédia...</div>
            ) : filteredFoods.length > 0 ? (
                <>
                  {filteredFoods.map((item, idx) => {
                    // SE NÃO É ASSINANTE E PASSOU DO 3º ITEM, APLICA O BLUR E BLOQUEIA
                    const isBlurred = !isSubscriber && idx >= 3;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-xl border flex items-center justify-between transition-all ${getStatusColor(item.status)} ${isBlurred ? 'blur-sm opacity-50 select-none' : 'hover:bg-zinc-900/50'}`}
                      >
                        <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-base text-zinc-100">{item.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border ${getStatusColor(item.status)}`}>
                                    {translateStatus(item.status)}
                                </span>
                            </div>
                            {item.description && <p className="text-xs opacity-70 leading-relaxed line-clamp-2">{item.description}</p>}
                        </div>
                        <div className={`shrink-0 p-2 rounded-full border ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* BOTÃO FLUTUANTE DE DESBLOQUEIO POR CIMA DA ÁREA EMBAÇADA */}
                  {!isSubscriber && filteredFoods.length > 3 && (
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent flex items-end justify-center pb-8 z-10">
                      <button 
                        onClick={() => setShowPaywall(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-105 transition-transform text-black font-bold py-4 px-8 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.3)] flex items-center gap-2"
                      >
                        <Lock size={18} /> Desbloquear Guia Completo
                      </button>
                    </div>
                  )}
                </>
            ) : (
                <div className="text-center py-10">
                    <p className="text-zinc-500 mb-2">Nenhum alimento encontrado com este filtro.</p>
                    <button onClick={() => {setStatusFilter('all'); setSearchTerm('')}} className="text-amber-500 text-sm font-bold underline">Limpar filtros</button>
                </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE VENDAS */}
      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        userId={user?.id || ''} 
      />
    </div>
  );
}
