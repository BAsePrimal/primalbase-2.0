'use client'

import Link from 'next/link'
import { ChefHat, Home, Apple, ScanLine, BookOpen, Map, X, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Recipe {
  id: string
  title: string
  category: string
  prep_time: string
  ingredients: string
  instructions: string
  benefits: string
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    async function fetchRecipes() {
      if (!supabase) {
        console.warn('Supabase não configurado')
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')

        if (error) {
          console.error('Erro ao buscar receitas:', error)
        } else {
          setRecipes(data as Recipe[])
        }
      } catch (error) {
        console.error('Erro na requisição:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipes()
  }, [])

  // Formatar ingredientes e instruções para listas legíveis
  const formatList = (text: string) => {
    if (!text) return []
    return text.split('\n').filter(line => line.trim() !== '')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <ChefHat className="w-7 h-7 text-amber-500" />
          <h1 className="text-2xl font-bold text-amber-500">Receitas Ancestrais</h1>
        </div>
        <Link href="/">
          <button className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
            <Home className="w-5 h-5 text-zinc-400" />
          </button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6">
        {!supabase ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <ChefHat className="w-16 h-16 text-amber-500/50" />
            <p className="text-lg text-zinc-400">Configure o Supabase para ver as receitas</p>
            <p className="text-sm text-zinc-500">Adicione as variáveis de ambiente necessárias</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <ChefHat className="w-16 h-16 text-amber-500/50 animate-pulse" />
            <p className="text-lg text-zinc-400">Carregando receitas ancestrais...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <ChefHat className="w-16 h-16 text-amber-500/50" />
            <p className="text-lg text-zinc-400">Nenhuma receita encontrada</p>
            <p className="text-sm text-zinc-500">Adicione receitas na tabela do Supabase</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Título */}
                <h3 className="text-xl font-bold text-amber-500 mb-3">
                  {recipe.title}
                </h3>

                {/* Botão Ver Receita - Fixo no rodapé */}
                <button className="w-full mt-auto px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg font-medium transition-colors">
                  Ver Receita Completa
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Detalhes */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-amber-500">{selectedRecipe.title}</h2>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-6 py-6 space-y-6">
              {/* Categoria */}
              <div className="flex items-center gap-4">
                {selectedRecipe.category && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                    {selectedRecipe.category}
                  </span>
                )}
              </div>

              {/* Benefícios - DESTAQUE VISUAL */}
              {selectedRecipe.benefits && (
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-amber-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Benefícios
                  </h3>
                  <p className="text-zinc-200 leading-relaxed">{selectedRecipe.benefits}</p>
                </div>
              )}

              {/* Ingredientes */}
              {selectedRecipe.ingredients && (
                <div>
                  <h3 className="text-lg font-bold text-amber-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Ingredientes
                  </h3>
                  <ul className="space-y-2">
                    {formatList(selectedRecipe.ingredients).map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-3 text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Modo de Preparo */}
              {selectedRecipe.instructions && (
                <div>
                  <h3 className="text-lg font-bold text-amber-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Modo de Preparo
                  </h3>
                  <ol className="space-y-3">
                    {formatList(selectedRecipe.instructions).map((step, index) => (
                      <li key={index} className="flex items-start gap-3 text-zinc-300">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          <Link href="/" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-amber-500 transition-colors">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Início</span>
          </Link>
          
          <Link href="/nutrition" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-amber-500 transition-colors">
            <Apple className="w-6 h-6" />
            <span className="text-xs font-medium">Nutrição</span>
          </Link>
          
          <Link href="/scanner" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-amber-500 transition-colors">
            <ScanLine className="w-6 h-6" />
            <span className="text-xs font-medium">Scanner</span>
          </Link>
          
          <Link href="/guide" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-amber-500 transition-colors">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs font-medium">Guia</span>
          </Link>
          
          <Link href="/journey" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-amber-500 transition-colors">
            <Map className="w-6 h-6" />
            <span className="text-xs font-medium">Jornada</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
