'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setMessage({
        type: 'success',
        text: 'Se houver conta com este e-mail, enviamos um link de recuperação!'
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao enviar e-mail.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-500 mb-2">PrimalBase</h1>
          <p className="text-zinc-400">Recuperação de Senha</p>
        </div>

        <form onSubmit={handleReset} className="mt-8 space-y-6 bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          {message && (
            <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
              {message.text}
            </div>
          )}
          <div>
            <label htmlFor="email" className="sr-only">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-zinc-700 rounded-xl bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-black bg-amber-500 hover:bg-amber-400 transition-all disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link href="/login" className="font-medium text-amber-500 hover:text-amber-400 flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}
