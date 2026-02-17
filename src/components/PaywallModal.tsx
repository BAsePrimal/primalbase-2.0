'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function PaywallModal({ isOpen, onClose, userId }: PaywallModalProps) {
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
        body: JSON.stringify({ userId }),
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

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-24">
      <div className="bg-gradient-to-br from-zinc-900 to-black border-2 border-amber-500/50 rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-[0_0_50px_rgba(251,191,36,0.3)] relative animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-zinc-800/50 rounded-full transition-colors z-10"
          aria-label="Fechar"
        >
          <X className="w-6 h-6 text-zinc-400 hover:text-white" />
        </button>

        <div className="text-center mb-6 pt-6">
          <h2 className="text-3xl font-bold text-amber-500 mb-2">
            Desbloqueie Sua Melhor Versão
          </h2>
          <p className="text-zinc-400 text-lg">
            Teste <span className="text-amber-500 font-bold">GRÁTIS por 3 dias</span>
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold">Cardápios Inteligentes</p>
              <p className="text-zinc-400 text-sm">Planos alimentares criados sob medida para secar ou crescer.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold">Scanner Sem Limites</p>
              <p className="text-zinc-400 text-sm">Leia rótulos em segundos e fuja das armadilhas da indústria.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold">Chef IA Particular</p>
              <p className="text-zinc-400 text-sm">Ideias deliciosas com o que você já tem na geladeira.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold">Nutri 24h no Bolso</p>
              <p className="text-zinc-400 text-sm">Tire dúvidas e receba orientação da nossa IA a qualquer momento.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold">Guia VIP</p>
              <p className="text-zinc-400 text-sm">Acesso total à base de dados para você dominar sua alimentação.</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <p className="text-center text-amber-400 font-semibold mb-1">
            🎁 3 Dias Grátis
          </p>
          <p className="text-center text-zinc-300 text-sm">
            Depois apenas R$ 29,90/mês. Cancele quando quiser.
          </p>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-[0_0_30px_rgba(251,191,36,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? 'Processando...' : 'COMEÇAR TESTE GRÁTIS'}
        </button>

        <p className="text-center text-zinc-500 text-xs mt-4">
          Sem compromisso. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  );
}