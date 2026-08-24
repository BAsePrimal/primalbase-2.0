'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ChefHat, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';

// 👇 O arsenal de frases dinâmicas atualizado
const loadingPhrases = [
  "Analisando os ingredientes da base...",
  "Cruzando macros e densidade nutricional...",
  "Calculando a sua rota metabólica...",
  "Salvando sua testosterona da pizza...",
  "Preparando o seu Protocolo Ancestral...",
  "Ajustando as proporções ideais...",
  "Finalizando o plano tático..."
];

export default function ChefIAPage() {
  const [ingredientes, setIngredientes] = useState('');
  const [receita, setReceita] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // 👇 Novo estado para controlar a frase de carregamento atual
  const [phraseIndex, setPhraseIndex] = useState(0);

  // --- ESTADOS DO PAYWALL E MEMÓRIA ---
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [totalRecipesCount, setTotalRecipesCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  // Carrega Assinatura e Memória do Chef do BANCO DE DADOS
  useEffect(() => {
    async function loadChefData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_subscriber, daily_recipe_count, total_recipes')
          .eq('id', authUser.id)
          .single();
          
        if (profile) {
          setIsSubscriber(profile.is_subscriber || false);
          setUsageCount(profile.daily_recipe_count || 0);
          setTotalRecipesCount(profile.total_recipes || 0); 
        }
      }
    }
    loadChefData();
  }, []);

  // 👇 O MOTOR DE TEMPO: Roda as frases enquanto carrega
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setPhraseIndex(0); // Zera o contador sempre que começa a carregar
      interval = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 2000); // Troca de frase a cada 2 segundos (2000ms)
    }
    return () => clearInterval(interval); // Desliga o motor para não vazar memória
  }, [loading]);

  const handleGerarReceita = async () => {
    if (!ingredientes.trim()) return;

    if (!isSubscriber && usageCount >= 3) {
      setShowPaywall(true);
      return;
    }

    setReceita('');
    setLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredientes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar receita');
      }

      setReceita(data.recipe || data.receita || '');

      // --- ATUALIZA CONTADOR NO SUPABASE ---
      if (user) {
        const nextCount = usageCount + 1;
        const nextTotal = totalRecipesCount + 1; 

        setUsageCount(nextCount); 
        setTotalRecipesCount(nextTotal); 
        
        await supabase
          .from('profiles')
          .update({ 
            daily_recipe_count: nextCount,
            total_recipes: nextTotal
          })
          .eq('id', user.id);
      }

    } catch (err: any) {
      setReceita(`❌ Erro ao gerar receita: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receita);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Cabeçalho */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Chef Criativo</h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Área de Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-lg text-zinc-300">
              Quais ingredientes você tem aí?
            </label>
            <p className="text-sm text-zinc-500">
              Ex: ovos, batata doce, carne, espinafre
            </p>
          </div>

          <textarea
            value={ingredientes}
            onChange={(e) => setIngredientes(e.target.value)}
            placeholder="Digite os ingredientes que você tem..."
            className="w-full h-32 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />

          <button
            onClick={handleGerarReceita}
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/10"
          >
            <ChefHat className="w-5 h-5" />
            {loading ? 'Gerando Receita...' : 'Gerar Receita Ancestral'}
          </button>

          {/* BARRA DE CRÉDITOS DO CHEF */}
          {!isSubscriber && (
            <div className="pt-2 flex flex-col items-center gap-2">
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-700" 
                  style={{ width: `${Math.min((usageCount / 3) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">
                Receitas Gratuitas: {Math.max(3 - usageCount, 0)} / 3
              </p>
            </div>
          )}
        </div>

        {/* Área de Resultado */}
        {loading && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            {/* 👇 Injeção da frase dinâmica aqui */}
            <p className="text-zinc-400 font-medium animate-pulse transition-opacity duration-300">
              {loadingPhrases[phraseIndex]}
            </p>
          </div>
        )}

        {!loading && receita && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-orange-500">
                <ChefHat className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Sua Receita Ancestral</h2>
              </div>
              
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copiado!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copiar Receita</span></>
                )}
              </button>
            </div>
            
            <div className="prose prose-invert prose-orange max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold text-orange-400 mb-4 mt-6">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-bold text-orange-400 mb-3 mt-5">{children}</h2>,
                  strong: ({ children }) => <strong className="text-orange-400 font-semibold">{children}</strong>,
                }}
              >
                {receita}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE PAGAMENTO */}
      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        userId={user?.id || ''} 
      />
    </div>
  );
}