'use client';

import { useState } from 'react';
import { ArrowLeft, ChefHat, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function ChefIAPage() {
  const [ingredientes, setIngredientes] = useState('');
  const [receita, setReceita] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGerarReceita = async () => {
    if (!ingredientes.trim()) {
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
            className="w-full h-32 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          />

          <button
            onClick={handleGerarReceita}
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChefHat className="w-5 h-5" />
            {loading ? 'Gerando Receita...' : 'Gerar Receita Ancestral'}
          </button>
        </div>

        {/* Área de Resultado - Com React Markdown */}
        {loading && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            <p className="text-zinc-400 animate-pulse">Carregando receita...</p>
          </div>
        )}

        {!loading && receita && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-amber-500">
                <ChefHat className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Sua Receita Ancestral</h2>
              </div>
              
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Receita</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="prose prose-invert prose-amber max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-amber-400 mb-4 mt-6">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-amber-400 mb-3 mt-5">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-amber-300 mb-2 mt-4">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 text-zinc-300 mb-4 ml-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 text-zinc-300 mb-4 ml-2">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-zinc-300 leading-relaxed">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-amber-400 font-semibold">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-amber-300 italic">{children}</em>
                  ),
                  code: ({ children }) => (
                    <code className="bg-zinc-800 text-amber-400 px-2 py-1 rounded text-sm">{children}</code>
                  ),
                }}
              >
                {receita}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
