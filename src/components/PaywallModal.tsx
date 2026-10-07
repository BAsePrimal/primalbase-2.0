'use client';

import { useState } from 'react';
import { X, ShieldCheck, MessageCircle, CheckCircle2 } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function PaywallModal({ isOpen, onClose, userId }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'mensal' | 'semestral' | 'anual'>('mensal');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, plan: selectedPlan }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSupportClick = () => {
    const phoneNumber = "5531997374012"; 
    const message = encodeURIComponent("Olá! Tenho uma dúvida sobre o plano VIP do PrimalBase.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-zinc-950/95 backdrop-blur-md animate-in fade-in duration-300">
      
      <div className="relative w-full max-h-[92vh] md:max-h-[90vh] max-w-lg bg-zinc-900 rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border-t md:border border-zinc-800">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-zinc-800/80 backdrop-blur-md p-2 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto no-scrollbar p-5 md:p-8 pt-8">
          
          <div className="text-center mb-5 max-w-sm mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight leading-tight">
              Desbloqueie o <br />
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Acesso VIP</span>
            </h2>
          </div>

          <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4 flex flex-col gap-3 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-zinc-300 text-sm font-medium leading-snug"><strong className="text-white">Pare de errar</strong> na dieta por falta de tempo ou ideias.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-zinc-300 text-sm font-medium leading-snug"><strong className="text-white">Saiba exatamente</strong> o que comer com cardápios automáticos.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-zinc-300 text-sm font-medium leading-snug"><strong className="text-white">Analise a composição</strong> real de qualquer alimento por foto.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-zinc-300 text-sm font-medium leading-snug"><strong className="text-white">Tenha um especialista</strong> no bolso para qualquer dúvida.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-2">
            
            {/* MENSAL */}
            <div 
              onClick={() => setSelectedPlan('mensal')}
              className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                selectedPlan === 'mensal' 
                  ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPlan === 'mensal' ? 'border-orange-500' : 'border-zinc-600'}`}>
                  {selectedPlan === 'mensal' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                </div>
                <div>
                  <h3 className="text-white font-bold leading-none mb-1">Mensal</h3>
                  {/* 🔥 Objeção Aniquilada: Sem fidelidade */}
                  <p className="text-zinc-500 text-[11px] font-medium leading-none">Sem fidelidade</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-zinc-400 text-sm font-bold">R$</span>
                  <span className="text-white font-black text-xl">29,90</span>
                </div>
              </div>
            </div>

            {/* SEMESTRAL */}
            <div 
              onClick={() => setSelectedPlan('semestral')}
              className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                selectedPlan === 'semestral' 
                  ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPlan === 'semestral' ? 'border-orange-500' : 'border-zinc-600'}`}>
                  {selectedPlan === 'semestral' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                </div>
                <div>
                  <h3 className="text-white font-bold leading-none mb-1">Semestral</h3>
                  <p className="text-zinc-500 text-[11px] font-medium leading-none">Equivale a R$ 24,90/mês</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-zinc-400 text-sm font-bold">R$</span>
                  <span className="text-white font-black text-xl">149,90</span>
                </div>
              </div>
            </div>

            {/* ANUAL */}
            <div 
              onClick={() => setSelectedPlan('anual')}
              className={`relative flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                selectedPlan === 'anual' 
                  ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase tracking-widest py-0.5 px-2 rounded-full shadow-lg">
                O Mais Barato
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPlan === 'anual' ? 'border-orange-500' : 'border-zinc-600'}`}>
                  {selectedPlan === 'anual' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                </div>
                <div>
                  <h3 className="text-white font-bold leading-none mb-1">Anual</h3>
                  <p className="text-zinc-500 text-[11px] font-medium leading-none">Equivale a R$ 16,49/mês</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-orange-400/80 text-sm font-bold">R$</span>
                  <span className="text-orange-400 font-black text-xl">197,90</span>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-4 pb-2 flex justify-center">
            <button 
              onClick={handleSupportClick}
              className="flex items-center gap-2 text-zinc-500 hover:text-green-500 transition-colors text-xs font-medium group"
            >
              <MessageCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Dúvidas sobre o plano? Fale conosco
            </button>
          </div>
        </div>

        <div className="shrink-0 bg-zinc-900 border-t border-zinc-800 p-5 pb-8 md:pb-5 z-20">
          <div className="max-w-md mx-auto space-y-3">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-lg py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : 'Iniciar Meus 3 Dias Grátis'}
            </button>
            
            <div className="flex items-center justify-center gap-1.5 text-zinc-500 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <p>Cancele direto pelo seu Perfil no app.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}