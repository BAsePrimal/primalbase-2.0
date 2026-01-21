'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Criar a conta SEM emailRedirectTo (isso pode estar causando a mensagem)
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.name },
        },
      });
      
      if (signUpError) throw signUpError;

      // 2. Fazer login automático imediatamente
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      // 3. Redirecionar IMEDIATAMENTE
      router.replace('/');
      
    } catch (err: any) {
      alert('Erro ao cadastrar: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/612876e9-e369-433d-a381-d02938696ed1.png" 
            alt="PrimalBase" 
            className="h-32 w-auto mx-auto mb-6" 
            style={{ imageRendering: 'crisp-edges' }}
          />
          <h2 className="text-4xl font-bold text-white mb-2">Criar Conta</h2>
          <p className="text-zinc-400">Comece sua jornada de transformação</p>
        </div>

        <form onSubmit={handleRegister} className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Nome</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input 
                type="text" 
                placeholder="Seu nome"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input 
                type="email" 
                placeholder="seu@email.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-amber-500"
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-all mt-4 disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Cadastrar'} <ArrowRight size={20} className="inline ml-2"/>
          </button>
        </form>

        <p className="text-center mt-8 text-zinc-500 text-sm">
          Já tem uma conta? <Link href="/login" className="text-amber-500 font-bold hover:underline">Faça Login</Link>
        </p>
      </div>
    </div>
  );
}
