'use client';

import { useState } from 'react';
import { X, ShieldCheck, MessageCircle } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function PaywallModal({ isOpen, onClose, userId }: PaywallModalProps) {
  // O Anual já vem selecionado por padrão (A Isca Tática)
  const [selectedPlan, setSelectedPlan] = useState<'mensal' | 'semestral' | 'anual'>('anual');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      // Agora o frontend envia qual plano foi escolhido para a sua API processar
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

  // Função para abrir o WhatsApp de Suporte
  const handleSupportClick = () => {
    const phoneNumber = "5531997374012"; 
    const message = encodeURIComponent("Olá! Tenho uma dúvida sobre o plano VIP do PrimalBase.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[95vh] no-scrollbar">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Premium */}
        <div className="text-center mb-10 max-w-2xl mx-auto pt-4">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Desbloqueie o <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Protocolo Completo</span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl font-medium">
            Ferramentas de alta performance. Sem restrições.
          </p>
        </div>

        {/* Grid de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Card 1: Mensal */}
          <div 
            onClick={() => setSelectedPlan('mensal')}
            className={`relative flex flex-col p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
              selectedPlan === 'mensal' 
                ? 'border-orange-500 bg-zinc-800/80 shadow-[0_0_20px_rgba(249,115,22,0.15)]' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <div className="mb-4 min-h-[3.5rem]">
              <h3 className="text-xl font-bold text-white mb-1">Mensal</h3>
              <p className="text-zinc-500 text-sm font-medium">Cobrado mensalmente</p>
            </div>
            <div className="my-4 flex items-baseline gap-1">
              <span className="text-lg font-bold text-zinc-400">R$</span>
              <span className="text-3xl font-black text-white">29,90</span>
            </div>
            <div className="mt-auto pt-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'mensal' ? 'border-orange-500' : 'border-zinc-700'}`}>
                {selectedPlan === 'mensal' && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
              </div>
            </div>
          </div>

          {/* Card 2: Semestral (A Isca Tática) */}
          <div 
            onClick={() => setSelectedPlan('semestral')}
            className={`relative flex flex-col p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
              selectedPlan === 'semestral' 
                ? 'border-orange-500 bg-zinc-800/80 shadow-[0_0_20px_rgba(249,115,22,0.15)]' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <div className="mb-4 min-h-[3.5rem]">
              <h3 className="text-xl font-bold text-white mb-1">Semestral</h3>
              <p className="text-zinc-500 text-sm font-medium">Equivale a R$ 24,90/mês</p>
            </div>
            <div className="my-4 flex items-baseline gap-1">
              <span className="text-lg font-bold text-zinc-400">R$</span>
              <span className="text-3xl font-black text-white">149,90</span>
              <span className="text-sm font-medium text-zinc-500 ml-1">/semestre</span>
            </div>
            <div className="mt-auto pt-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'semestral' ? 'border-orange-500' : 'border-zinc-700'}`}>
                {selectedPlan === 'semestral' && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
              </div>
            </div>
          </div>

          {/* Card 3: Anual (O Alvo Destaque) */}
          <div 
            onClick={() => setSelectedPlan('anual')}
            className={`relative flex flex-col p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 md:scale-[1.05] z-10 ${
              selectedPlan === 'anual' 
                ? 'border-orange-500 bg-zinc-800 shadow-[0_0_30px_rgba(249,115,22,0.25)]' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            {/* Tag Flutuante */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg whitespace-nowrap">
              Escolha Inteligente
            </div>

            <div className="mb-4 pt-2 min-h-[3.5rem]">
              <h3 className="text-xl font-bold text-white mb-1">Anual</h3>
              <p className="text-orange-300/80 text-sm font-medium">Equivale a R$ 16,49/mês</p>
            </div>
            <div className="my-4 flex items-baseline gap-1">
              <span className="text-lg font-bold text-orange-400/80">R$</span>
              <span className="text-4xl font-black text-orange-400">197,90</span>
              <span className="text-sm font-medium text-zinc-500 ml-1">/ano</span>
            </div>
            <div className="mt-auto pt-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'anual' ? 'border-orange-500' : 'border-zinc-700'}`}>
                {selectedPlan === 'anual' && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
              </div>
            </div>
          </div>

        </div>

        {/* CTA - Call To Action */}
        <div className="max-w-md mx-auto text-center space-y-4 mb-6">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-lg py-5 px-8 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] active:scale-95 tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : 'Iniciar Meus 3 Dias Grátis'}
          </button>
          
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm font-medium">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <p>Cancele quando quiser. Cobrança apenas após o período de teste.</p>
          </div>
        </div>

        {/* Botão de Suporte WhatsApp */}
        <div className="pt-6 border-t border-zinc-800/50 flex justify-center">
          <button 
            onClick={handleSupportClick}
            className="flex items-center gap-2 text-zinc-400 hover:text-green-500 transition-colors text-sm font-medium group"
          >
            <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Dúvidas sobre o plano? Fale conosco
          </button>
        </div>

      </div>
    </div>
  );
}