'use client';

import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { BellRing, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BannerRadar() {
  const [visivel, setVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    // Só mostra o banner se ele AINDA NÃO tiver dado permissão
    const checkStatus = setTimeout(() => {
      if (typeof window !== 'undefined' && OneSignal.Notifications) {
        if (!OneSignal.Notifications.permission) {
          setVisivel(true);
        }
      }
    }, 1500);

    return () => clearTimeout(checkStatus);
  }, []);

  const handleAtivar = async () => {
    setCarregando(true);
    try {
      // 🔥 O Pulo do Gato: Chama a permissão NATIVA direto, ignorando a caixa branca
      await OneSignal.Notifications.requestPermission();
      
      setTimeout(async () => {
        const temPermissao = OneSignal.Notifications.permission;
        if (temPermissao && OneSignal.User.PushSubscription.id) {
          const onesignalId = OneSignal.User.PushSubscription.id;
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            await supabase
              .from('profiles')
              .update({ onesignal_id: onesignalId })
              .eq('id', user.id);
          }
          setVisivel(false); // O botão se autodestrói (some da tela)
        }
        setCarregando(false);
      }, 2500);
    } catch (error) {
      console.error('Erro no radar:', error);
      setCarregando(false);
    }
  };

  if (!visivel) return null; // Invisibilidade ativada

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-5 mb-6 shadow-lg">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl shrink-0">
            <BellRing className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-black uppercase tracking-tight text-sm">Alerta de Jejum Desativado</h3>
            <p className="text-zinc-400 text-xs mt-1 max-w-xs">
              Não perca a hora de quebrar o jejum. Ative o radar para receber notificações da sua jornada.
            </p>
          </div>
        </div>

        <button
          onClick={handleAtivar}
          disabled={carregando}
          className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50"
        >
          {carregando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          {carregando ? 'Conectando...' : 'Ativar Agora'}
        </button>
      </div>
    </div>
  );
}