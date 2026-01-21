'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, BookOpen, Apple, ChefHat, AlertCircle, CheckCircle2, TriangleAlert } from 'lucide-react';

export default function GuidePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'alimentos' | 'receitas'>('alimentos');
  // Estado inicial: 'allowed' (Permitidos)
  const [statusFilter, setStatusFilter] = useState<'all' | 'allowed' | 'moderate' | 'banned'>('allowed'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFoods() {
      try {
        const { data, error } = await supabase
          .from('foods')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setFoods(data || []);
      } catch (error) {
        console.error('Erro ao buscar alimentos:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFoods();
  }, []);

  // Lógica de Filtragem Corrigida
  const filteredFoods = foods.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helpers de Visualização
  const getStatusColor = (status: string) => {
    if (status === 'allowed') return 'text-green-500 border-green-900/30 bg-green-900/10';
    if (status === 'moderate') return 'text-yellow-500 border-yellow-900/30 bg-yellow-900/10';
    return 'text-red-500 border-red-900/30 bg-red-900/10'; // Para banned
  };

  const getStatusIcon = (status: string) => {
    if (status === 'allowed') return <CheckCircle2 size={18} />;
    if (status === 'moderate') return <TriangleAlert size={18} />;
    return <AlertCircle size={18} />; // Para banned
  };

  const translateStatus = (status: string) => {
    if (status === 'allowed') return 'PERMITIDO';
    if (status === 'moderate') return 'MODERADO';
    if (status === 'banned') return 'PROIBIDO';
    return status.toUpperCase();
  };

  // Função para redirecionar para a página de receitas
  const handleReceitasClick = () => {
    router.push('/recipes');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 pb-28 font-sans">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-amber-500 flex items-center gap-2">
          <BookOpen /> Guia de Alimentos
        </h1>
      </header>

      {/* Barra de Busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-zinc-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar alimento ou receita..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-amber-500 transition-all"
        />
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
          
          {/* Filtros Rápidos - NOVA ORDEM: Permitidos (Verde), Moderados (Amarelo), Proibidos (Vermelho), Todos (Cinza) */}
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

          {/* Lista de Alimentos */}
          <div className="space-y-2">
            {loading ? (
               <div className="text-center py-10 text-zinc-500 animate-pulse">Carregando enciclopédia...</div>
            ) : filteredFoods.length > 0 ? (
                filteredFoods.map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:bg-zinc-900/50 ${getStatusColor(item.status)}`}>
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
                ))
            ) : (
                <div className="text-center py-10">
                    <p className="text-zinc-500 mb-2">Nenhum alimento encontrado com este filtro.</p>
                    <button onClick={() => {setStatusFilter('all'); setSearchTerm('')}} className="text-amber-500 text-sm font-bold underline">Limpar filtros</button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
