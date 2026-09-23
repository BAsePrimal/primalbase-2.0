'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, Zap } from 'lucide-react';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id'); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados do Formulário
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | ''>('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); 
    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); 
      value = value.replace(/(\d)(\d{4})$/, '$1-$2'); 
    }
    setWhatsapp(value);
  };

  const vincularAssinatura = async (userId: string) => {
    if (!sessionId) return; 
    try {
      await fetch('/api/link-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId }),
      });
    } catch (err) {
      console.error('Erro ao vincular assinatura:', err);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!fullName || !email || !password || !whatsapp || !gender || !goal || !currentWeight || !height) {
      setError('Por favor, preencha todos os campos para montar seu perfil.');
      setLoading(false);
      return;
    }

    try {
      // 1. Cria a conta no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, gender: gender, goal: goal },
        },
      });

      if (error) throw error;

      if (data.user) {
        // 2. Salva os dados no banco de Perfis
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName,
            whatsapp: whatsapp, 
            gender: gender,
            goal: goal,
            current_weight: parseFloat(currentWeight), 
            height: parseInt(height, 10), 
            level: 1,
          });

        if (profileError) throw profileError;

        // 3. Dispara o E-mail VIP de Boas-Vindas
        fetch('/api/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, name: fullName }),
        }).catch(err => console.error("Falha no disparo em segundo plano:", err));

        // 4. Faz o login automático
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        // 5. Vincula a compra do Stripe (O Ticket Dourado)
        await vincularAssinatura(data.user.id); 

        // 6. Joga pro painel
        router.replace('/');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-amber-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10">
        
        {/* Cabeçalho Limpo e Premium */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
            Complete o seu Perfil
          </h1>
          <p className="text-zinc-400 text-base font-medium">
            Assinatura confirmada. Preencha os dados abaixo para criar o seu acesso.
          </p>
        </div>

        {/* Formulário Limpo */}
        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-zinc-800 p-6 md:p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleCompleteProfile} className="space-y-5">
            
            <div className="space-y-4">
              <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">Dados de Acesso</h3>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-50 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email (O mesmo da compra)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-50 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">WhatsApp</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={handleWhatsAppChange}
                  maxLength={15}
                  required
                  className="w-full px-4 py-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-50 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Crie uma Senha Segura</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-50 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">Métricas Corporais</h3>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Gênero Biológico</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('Masculino')}
                    className={`py-3.5 px-4 rounded-xl font-semibold transition-all ${
                      gender === 'Masculino'
                        ? 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-zinc-950/50 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    Masculino
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('Feminino')}
                    className={`py-3.5 px-4 rounded-xl font-semibold transition-all ${
                      gender === 'Feminino'
                        ? 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-zinc-950/50 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    Feminino
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Peso (kg)</label>
                  <input
                    type="number"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    required step="0.1" min="30" max="300"
                    className="w-full px-4 py-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-50 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder="Ex: 75.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Altura (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    required min="100" max="250"
                    className="w-full px-4 py-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-50 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder="Ex: 175"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Objetivo Principal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-50 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all appearance-none"
                >
                  <option value="" disabled className="text-zinc-500">Selecione sua meta</option>
                  <option value="Perda de Gordura">Perda de Gordura (Secar)</option>
                  <option value="Ganho de Massa">Ganho de Massa (Crescer limpo)</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-lg py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</> : 'Salvar Perfil e Acessar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}