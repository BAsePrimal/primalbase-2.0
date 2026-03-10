'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { usePathname } from 'next/navigation';
import { BellRing, X, Activity } from 'lucide-react';

export default function OneSignalInit() {
  const [showPushModal, setShowPushModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();

  // 1. LIGA O MOTOR SILENCIOSO DO ONESIGNAL
  useEffect(() => {
    const initOneSignal = async () => {
      if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return;
      
      try {
        if (!isInitialized) {
          await OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
            safari_web_id: "web.onesignal.auto.64337d6b-67cd-4296-b41c-d41bc6b4a874",
            allowLocalhostAsSecureOrigin: true,
          });
          setIsInitialized(true);
          console.log('🐺 Radar OneSignal ativado na matilha!');
        }
      } catch (error) {
        console.error('Falha ao ligar o OneSignal:', error);
      }
    };

    initOneSignal();
  }, [isInitialized]);

  // 2. A INTELIGÊNCIA DO "SOCO 2" (COBRA A PERMISSÃO)
  useEffect(() => {
    if (!isInitialized || pathname === '/login' || pathname === '/quiz') return;

    const checkPushStatus = async () => {
      // Regra 1: O recruta instalou o app? (Se não instalou, deixa o InstallModal agir primeiro)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (!isStandalone) return;

      // Regra 2: Ele já liberou as notificações nativas do celular?
      const hasPermission = OneSignal.Notifications.permission;
      if (hasPermission) return; // Se já tem, o radar está verde. Fim da caçada.

      // Regra 3: Checa o Timer de Folga de 24 horas
      const lastDismissed = localStorage.getItem('primalbase_push_cooldown');
      if (lastDismissed) {
        const tempoPassado = Date.now() - parseInt(lastDismissed, 10);
        const vinteQuatroHoras = 24 * 60 * 60 * 1000;
        if (tempoPassado < vinteQuatroHoras) return; // O soldado está na folga
      }

      // Caiu na malha fina! Mostra o modal de cobrança.
      setShowPushModal(true);
    };

    // Delay tático de 1.5s para não assustar o usuário assim que a tela abre
    setTimeout(checkPushStatus, 1500);
    
  }, [isInitialized, pathname]);

  const handleAllowPush = async () => {
    try {
      // Isso aqui é o que CHAMA a tela preta nativa da Apple/Android perguntando "Deseja Permitir?"
      await OneSignal.Notifications.requestPermission();
      setShowPushModal(false);
    } catch (error) {
      console.error("Erro ao pedir permissão de Push", error);
    }
  };

  const handleDismiss = () => {
    // Liga o cronômetro de 24 horas caso ele negue
    localStorage.setItem('primalbase_push_cooldown', Date.now().toString());
    setShowPushModal(false);
  };

  if (!showPushModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 overflow-hidden">
      <div className="bg-zinc-900 border border-amber-500/30 rounded-[2rem] w-full max-w-[90vw] sm:max-w-sm p-6 relative shadow-[0_10px_40px_rgba(245,158,11,0.15)] overflow-hidden">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80"></div>

        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-2"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
            <BellRing className="w-8 h-8 text-amber-500 relative z-10" />
          </div>

          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3 leading-tight">
            Seu Rádio está <br />
            <span className="text-amber-500">Desligado</span>
          </h2>
          
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Você já está no QG, mas não ativou os <strong>Alertas Biológicos</strong>. Libere as notificações para receber os avisos de Jejum e missões da Jornada.
          </p>

          <div className="w-full bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50 mb-6 flex items-center gap-3">
             <Activity className="w-6 h-6 text-amber-500 shrink-0" />
             <p className="text-zinc-300 text-xs text-left">
               Ao clicar abaixo, seu celular vai perguntar se você permite notificações. <strong className="text-white">Clique em Permitir.</strong>
             </p>
          </div>

          <button 
            onClick={handleAllowPush}
            className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            Ativar Radar Agora
          </button>
        </div>
      </div>
    </div>
  );
}