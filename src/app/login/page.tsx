'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Campos do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | ''>('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login com Google');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações
    if (!fullName || !gender || !currentWeight || !height || !goal) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            gender: gender,
            current_weight: Number(currentWeight),
            height: Number(height),
            goal: goal,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Atualizar perfil na tabela profiles (upsert para evitar conflito com trigger)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName,
            gender: gender,
            current_weight: Number(currentWeight),
            height: Number(height),
            goal: goal,
            level: 1,
          });

        if (profileError) throw profileError;

        // Login automático após cadastro
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Redirecionar para a página inicial
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/612876e9-e369-433d-a381-d02938696ed1.png" 
            alt="PrimalBase" 
            className="h-32 w-auto mx-auto mb-4" 
            style={{ imageRendering: 'crisp-edges' }}
          />
          <p className="text-zinc-400">Sua jornada ancestral começa aqui</p>
        </div>

        {/* Card Principal */}
        <div className="bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Abas */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-4 font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-4 font-semibold transition-colors ${
                mode === 'signup'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Formulário */}
          <div className="p-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Botão Google */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-3 border border-gray-300"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar com Google
                </button>

                {/* Separador "ou" */}
                <div className="relative flex items-center justify-center my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-700"></div>
                  </div>
                  <div className="relative bg-zinc-900 px-4">
                    <span className="text-sm text-zinc-500">ou</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="••••••••"
                  />
                </div>

                <Link href="/auth/forgot-password" className="text-xs text-amber-500 hover:text-amber-400 block text-right mb-4">
                  Esqueceu a senha?
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Nome Completo */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Seu nome completo"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="seu@email.com"
                  />
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                {/* Gênero */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Gênero
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGender('Masculino')}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        gender === 'Masculino'
                          ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-400'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      Sou Leão 🦁
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Feminino')}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        gender === 'Feminino'
                          ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-400'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      Sou Leoa 🐆
                    </button>
                  </div>
                </div>

                {/* Dados Físicos */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      required
                      min="30"
                      max="300"
                      step="0.1"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      required
                      min="100"
                      max="250"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="175"
                    />
                  </div>
                </div>

                {/* Meta */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Sua Meta
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Selecione sua meta</option>
                    <option value="Perda de Gordura">Perda de Gordura</option>
                    <option value="Ganho de Massa">Ganho de Massa</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
