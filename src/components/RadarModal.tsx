'use client';

import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { Bell, X, Activity, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RadarModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && OneSignal.Notifications) {
        const temPermissao = OneSignal.Notifications.permission;
        const jaDispensou = localStorage.getItem('primalbase_radar_dismissed');

        // Só pula na tela se não tiver permissão E se o cara nunca tiver fechado antes
        if (!temPermissao && !jaDispensou) {
          setIsOpen(true);
        }
      }
    }, 3000); // Aparece após 3 segundos na página

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('primalbase_radar_dismissed', 'true'); // Memória de elefante
    setIsOpen(false);
  };

  const handleAtivar = async () => {
    setCarregando(true);
    try {
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
          setIsOpen(false);
        } else {
          handleDismiss(); // Se ele negou na tela nativa, já marca como dispensado
        }
        setCarregando(false);
      }, 2500);
    } catch (error) {
      console.error(error);
      setCarregando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 relative shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* Efeito luminoso de fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-amber-500/10 blur-[50px] pointer-events-none"></div>

        <button 
          onClick={handleDismiss}
          className="absolute right-4 top-4 p-2 text-zinc-500 hover:text-white bg-zinc-800/50 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-4 relative z-10">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-5">
            <Activity className="w-8 h-8 text-amber-500" />
          </div>
          
          <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight mb-3">
            Sincronize seu <br /><span className="text-amber-500">Relógio Biológico</span>
          </h2>
          
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            Seu jejum é calculado ao minuto. Ative os alertas para que a Matilha te avise o momento exato de comer e de fechar a janela.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={handleAtivar}
              disabled={carregando}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50 disabled:scale-100 active:scale-95"
            >
              {carregando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
              {carregando ? 'Conectando Matilha...' : 'Sincronizar Alertas'}
            </button>
            
            <button
              onClick={handleDismiss}
              className="w-full py-4 text-zinc-500 hover:text-zinc-300 font-bold text-xs uppercase tracking-widest transition-colors"
            >
              Agora Não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}