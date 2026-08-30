'use client';

import { useState } from 'react';
import { X, ShieldCheck, MessageCircle, CheckCircle2 } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function PaywallModal({ isOpen, onClose, userId }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'mensal' | 'semestral' | 'anual'>('anual');
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
    // No mobile, o modal gruda embaixo (items-end) para parecer um aplicativo nativo. No PC, centraliza.
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-zinc-950/95 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Container Principal: Transformado em flex-col para separar rolagem do rodapé fixo */}
      <div className="relative w-full max-h-[92vh] md:max-h-[90vh] max-w-4xl bg-zinc-900 rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border-t md:border border-zinc-800">
        
        {/* Botão Fechar - Fixo no topo direito */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-50 bg-zinc-800/80 backdrop-blur-md p-2 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ÁREA DE ROLAGEM (Header, Benefícios e Cards) */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 md:p-10 pt-10">
          
          {/* Header Premium */}
          <div className="text-center mb-6 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
              Desbloqueie o <br className="md:hidden" />
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Protocolo Completo</span>
            </h2>
            <p className="text-zinc-400 text-base md:text-xl font-medium">
              Ferramentas de alta performance. Sem restrições.
            </p>
          </div>

          {/* 🔥 LISTA DE BENEFÍCIOS (Mais alinhada e compacta) */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-zinc-200 text-sm font-medium">Nutricionista IA 24h no seu bolso</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-zinc-200 text-sm font-medium">Scanner IA: Analise qualquer alimento por foto</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-zinc-200 text-sm font-medium">Acesso total ao Protocolo de 21 Dias</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-zinc-200 text-sm font-medium">Cardápios e listas de compras automáticas</p>
              </div>
            </div>
          </div>

          {/* Grid de Planos - Reduzimos o gap e o padding para caber mais na tela */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            
            {/* Card 1: Mensal */}
            <div 
              onClick={() => setSelectedPlan('mensal')}
              className={`relative flex flex-col p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                selectedPlan === 'mensal' 
                  ? 'border-orange-500 bg-zinc-800/80 shadow-[0_0_20px_rgba(249,115,22,0.15)]' 
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <div className="mb-3">
                <h3 className="text-lg font-bold text-white mb-0.5">Mensal</h3>
                <p className="text-zinc-500 text-xs font-medium">Cobrado mensalmente</p>
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-base font-bold text-zinc-400">R$</span>
                <span className="text-3xl font-black text-white">29,90</span>
              </div>
              <div className="mt-auto pt-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'mensal' ? 'border-orange-500' : 'border-zinc-700'}`}>
                  {selectedPlan === 'mensal' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                </div>
              </div>
            </div>

            {/* Card 2: Semestral */}
            <div 
              onClick={() => setSelectedPlan('semestral')}
              className={`relative flex flex-col p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                selectedPlan === 'semestral' 
                  ? 'border-orange-500 bg-zinc-800/80 shadow-[0_0_20px_rgba(249,115,22,0.15)]' 
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <div className="mb-3">
                <h3 className="text-lg font-bold text-white mb-0.5">Semestral</h3>
                <p className="text-zinc-500 text-xs font-medium">Equivale a R$ 24,90/mês</p>
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-base font-bold text-zinc-400">R$</span>
                <span className="text-3xl font-black text-white">149,90</span>
                <span className="text-xs font-medium text-zinc-500 ml-1">/sem.</span>
              </div>
              <div className="mt-auto pt-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'semestral' ? 'border-orange-500' : 'border-zinc-700'}`}>
                  {selectedPlan === 'semestral' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                </div>
              </div>
            </div>

            {/* Card 3: Anual (Destaque) */}
            <div 
              onClick={() => setSelectedPlan('anual')}
              className={`relative flex flex-col p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 md:scale-[1.05] z-10 ${
                selectedPlan === 'anual' 
                  ? 'border-orange-500 bg-zinc-800 shadow-[0_0_30px_rgba(249,115,22,0.25)]' 
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full shadow-lg whitespace-nowrap">
                Escolha Inteligente
              </div>

              <div className="mb-3 pt-1">
                <h3 className="text-lg font-bold text-white mb-0.5">Anual</h3>
                <p className="text-orange-300/80 text-xs font-medium">Equivale a R$ 16,49/mês</p>
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-base font-bold text-orange-400/80">R$</span>
                <span className="text-4xl font-black text-orange-400">197,90</span>
                <span className="text-xs font-medium text-zinc-500 ml-1">/ano</span>
              </div>
              <div className="mt-auto pt-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'anual' ? 'border-orange-500' : 'border-zinc-700'}`}>
                  {selectedPlan === 'anual' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                </div>
              </div>
            </div>

          </div>

          {/* Suporte dentro da área de rolagem para limpar o rodapé fixo */}
          <div className="pt-6 pb-2 flex justify-center">
            <button 
              onClick={handleSupportClick}
              className="flex items-center gap-2 text-zinc-500 hover:text-green-500 transition-colors text-sm font-medium group"
            >
              <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Dúvidas sobre o plano? Fale conosco
            </button>
          </div>
        </div>

        {/* 🔥 RODAPÉ FIXO (Sticky CTA) 🔥 */}
        <div className="shrink-0 bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800 p-5 pb-8 md:pb-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">
          <div className="max-w-md mx-auto space-y-3">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-lg md:text-xl py-4 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95 tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : 'Iniciar Meus 3 Dias Grátis'}
            </button>
            
            <div className="flex items-start justify-center gap-2 text-zinc-500 text-xs md:text-sm font-medium px-2">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <p className="leading-tight text-center">Cancele quando quiser. Cobrança apenas após o período de teste.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}