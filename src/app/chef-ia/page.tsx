'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ChefHat, Copy, Check, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';

// 👇 Nova tipagem para o JSON estruturado
interface RecipeData {
  title: string;
  prep_time: string;
  macros: string;
  ingredients: string[];
  instructions: string[];
  tip: string;
}

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
  const [receita, setReceita] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [phraseIndex, setPhraseIndex] = useState(0);

  // --- ESTADOS DO PAYWALL E MEMÓRIA ---
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [totalRecipesCount, setTotalRecipesCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setPhraseIndex(0);
      interval = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGerarReceita = async () => {
    if (!ingredientes.trim()) return;

    if (!isSubscriber && usageCount >= 3) {
      setShowPaywall(true);
      return;
    }

    setReceita(null);
    setErrorMsg('');
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

      if (data.recipe && typeof data.recipe === 'object') {
        setReceita(data.recipe);
      } else {
        throw new Error('Formato estruturado não reconhecido.');
      }

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
      setErrorMsg(`❌ Erro ao gerar receita: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 👇 Formatador do texto para Copiar / Compartilhar
  const formatRecipeText = (recipe: RecipeData) => {
    return `*${recipe.title}* 🥩\n⏱️ Preparo: ${recipe.prep_time}\n🔥 ${recipe.macros}\n\n*Ingredientes:*\n${recipe.ingredients.map(i => `• ${i}`).join('\n')}\n\n*Preparo:*\n${recipe.instructions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n💡 Dica: ${recipe.tip}\n\n---\nReceita gerada pelo Chef IA do PrimalBase. Baixe o app e crie o seu protocolo: [https://www.primalbase.com.br]`;
  };

  const handleCopy = async () => {
    if (!receita) return;
    try {
      await navigator.clipboard.writeText(formatRecipeText(receita));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleShareWhatsApp = () => {
    if (!receita) return;
    const shareText = formatRecipeText(receita);
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
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
            className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/10 active:scale-95"
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

        {/* MENSAGEM DE ERRO */}
        {errorMsg && (
          <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* TELA DE LOADING DINÂMICO */}
        {loading && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-zinc-400 font-medium animate-pulse transition-opacity duration-300 text-center">
              {loadingPhrases[phraseIndex]}
            </p>
          </div>
        )}

        {/* RESULTADO (A TELA PREMIUM) */}
        {!loading && receita && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            
            {/* Título Hero */}
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight leading-tight">
              {receita.title}
            </h2>

            {/* Badges Premium */}
            <div className="flex flex-wrap gap-3 mb-8">
              <span className="flex items-center gap-2 bg-zinc-800 text-zinc-300 text-sm font-bold px-4 py-2 rounded-full border border-zinc-700">
                ⏱️ {receita.prep_time}
              </span>
              <span className="flex items-center gap-2 bg-orange-500/10 text-orange-400 text-sm font-bold px-4 py-2 rounded-full border border-orange-500/20">
                🔥 {receita.macros}
              </span>
            </div>

            {/* Lista de Ingredientes (Estilo Check) */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-widest text-xs">Ingredientes</h3>
              <ul className="space-y-3">
                {receita.ingredients.map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-zinc-300 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instruções em Blocos */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-widest text-xs">Preparo</h3>
              <div className="space-y-4">
                {receita.instructions.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-orange-400 font-bold border border-zinc-700">
                      {index + 1}
                    </div>
                    <p className="text-zinc-300 pt-1 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dica do Chef */}
            <div className="bg-gradient-to-r from-orange-900/20 to-transparent border-l-4 border-orange-500 p-5 rounded-r-xl mb-8">
              <p className="text-orange-300 font-medium italic leading-relaxed">
                "{receita.tip}"
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800/50">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-all duration-200 font-bold active:scale-95"
              >
                {copied ? (
                  <><Check className="w-5 h-5 text-green-400" /><span className="text-green-400">Copiado!</span></>
                ) : (
                  <><Copy className="w-5 h-5 text-zinc-300" /><span className="text-zinc-300">Copiar</span></>
                )}
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl transition-all duration-200 font-bold active:scale-95"
              >
                <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-[#25D366]">Compartilhar</span>
              </button>
            </div>

          </div>
        )}
      </div>

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        userId={user?.id || ''} 
      />
    </div>
  );
}