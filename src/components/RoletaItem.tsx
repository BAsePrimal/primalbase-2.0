'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RoletaItemProps {
  nomeInicial: string;
  categoria?: string; 
  tipoRefeicao?: 'breakfast' | 'main_meat' | 'any';
  onTroca?: (novoNome: string) => void;
}

export default function RoletaItem({ nomeInicial, categoria, tipoRefeicao = 'any', onTroca }: RoletaItemProps) {
  const [nome, setNome] = useState(nomeInicial);
  const [loading, setLoading] = useState(false);

  // --- A MÁGICA QUE CONSERTA TUDO ---
  // Obriga a roleta a atualizar a tela sempre que o sistema gerar um cardápio novo ou mudar de dia!
  useEffect(() => {
    setNome(nomeInicial);
  }, [nomeInicial]);

  const handleRoleta = async () => {
    setLoading(true);
    try {
      let buscaCategoria = categoria;

      if (!buscaCategoria) {
        const { data: atualData } = await supabase
          .from('foods')
          .select('category')
          .ilike('name', `%${nome.split(' (')[0].trim()}%`) 
          .limit(1)
          .single();
        if (atualData) buscaCategoria = atualData.category;
      }

      if (!buscaCategoria) {
        setLoading(false);
        return;
      }

      const { data: substitutosRaw } = await supabase
        .from('foods')
        .select('name')
        .eq('category', buscaCategoria)
        .eq('status', 'allowed')
        .neq('name', nome.split(' (')[0].trim());
      
      let substitutos = substitutosRaw || [];

      // Filtro de Horário
      if (tipoRefeicao === 'breakfast') {
        substitutos = substitutos.filter((f: any) => {
            const n = f.name.toLowerCase();
            return n.includes('ovo') || n.includes('queijo') || n.includes('iogurte') || n.includes('bacon') || n.includes('coalho') || n.includes('ricota') || n.includes('cottage') || n.includes('presunto');
        });
      } else if (tipoRefeicao === 'main_meat') {
        substitutos = substitutos.filter((f: any) => {
            const n = f.name.toLowerCase();
            return !(n.includes('bacon') || n.includes('torresmo') || n.includes('linguiça') || n.includes('salsicha') || n.includes('ovo') || n.includes('queijo') || n.includes('presunto'));
        });
      }
      
      if (substitutos.length > 0) {
        const randomIndex = Math.floor(Math.random() * substitutos.length);
        const novoNomeBase = substitutos[randomIndex].name;
        
        const partes = nome.split(' (');
        const novaString = partes.length > 1 ? `${novoNomeBase} (${partes[1]}` : novoNomeBase;
        
        setNome(novaString);
        if (onTroca) onTroca(novaString);
      }
    } catch(error) {
      console.error("Erro na roleta:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full group">
      <span className="flex-1 text-inherit tracking-tight">{nome}</span>
      <button 
        onClick={handleRoleta}
        disabled={loading}
        className="p-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 hover:bg-zinc-700 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
        title="Trocar este alimento"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
      </button>
    </div>
  );
}