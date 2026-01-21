'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Verifica se o usuário chegou logado pelo link mágico
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // Se não tiver sessão (link expirou ou inválido), manda pro login
        router.push('/login');
      }
    };
    checkSession();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert('Erro: ' + error.message);
    } else {
      alert('Senha atualizada com sucesso! Você será redirecionado.');
      router.push('/'); // Manda pra Home logado
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-3xl font-bold text-white">Definir Nova Senha</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Escolha uma senha forte e segura
          </p>
        </div>

        <form onSubmit={handleUpdate} className="mt-8 space-y-6 bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          <div>
            <label htmlFor="password" className="sr-only">Nova Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Nova senha segura"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white outline-none focus:ring-2 focus:ring-amber-500"
              required
              minLength={6}
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading} 
            className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl disabled:opacity-50 hover:bg-amber-400 transition-all"
          >
            {loading ? 'Salvando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
