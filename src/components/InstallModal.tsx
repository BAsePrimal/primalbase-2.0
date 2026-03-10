'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Share, MoreVertical, Smartphone, X, Compass } from 'lucide-react';

export default function InstallModal() {
  const [showModal, setShowModal] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<'ios-safari' | 'ios-other' | 'android' | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Bloqueia na tela de Login e no Quiz
    if (pathname === '/login' || pathname === '/quiz') {
      return;
    }

    // 2. Verifica se o app já está instalado (PWA Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return; // Se o soldado já instalou, o modal nunca mais aparece. Fim da caçada.

    // 🔥 3. O NOVO CÉREBRO DE MEMÓRIA (COOLDOWN DE 24 HORAS)
    const lastDismissed = localStorage.getItem('primalbase_install_cooldown');
    if (lastDismissed) {
      const tempoPassado = Date.now() - parseInt(lastDismissed, 10);
      const vinteQuatroHoras = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
      
      if (tempoPassado < vinteQuatroHoras) {
        return; // ⏳ O soldado ainda está na folga de 24h. O modal não aparece hoje.
      }
    }

    // 4. O Cérebro que lê o celular (Se chegou aqui, é hora de mostrar o modal)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);

    if (isIOS && isSafari) {
      setDeviceInfo('ios-safari');
      setShowModal(true);
    } else if (isIOS && !isSafari) {
      setDeviceInfo('ios-other');
      setShowModal(true);
    } else if (isAndroid) {
      setDeviceInfo('android');
      setShowModal(true);
    }
  }, [pathname]);

  // O "OUVIDO": Escuta o clique do botão no Perfil (Caso o cara queira forçar a abertura)
  useEffect(() => {
    const handleForceShow = () => {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const isAndroid = /android/.test(ua);
      const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);

      if (isIOS && isSafari) {
        setDeviceInfo('ios-safari');
      } else if (isIOS && !isSafari) {
        setDeviceInfo('ios-other');
      } else if (isAndroid) {
        setDeviceInfo('android');
      }
      
      setShowModal(true);
    };

    window.addEventListener('forceInstallModal', handleForceShow);
    return () => window.removeEventListener('forceInstallModal', handleForceShow);
  }, []);

  const handleDismiss = () => {
    // 🔥 AQUI NÓS LIGAMOS O CRONÔMETRO: Grava o milissegundo exato que ele clicou em fechar
    localStorage.setItem('primalbase_install_cooldown', Date.now().toString());
    setShowModal(false);
  };

  if (pathname === '/login' || pathname === '/quiz' || !showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 overflow-hidden">
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-[90vw] sm:max-w-sm p-6 relative shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>

        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-2"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
            <Smartphone className="w-8 h-8 text-amber-500 relative z-10" />
          </div>

          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3 leading-tight">
            Leve a Alcateia <br />
            <span className="text-amber-500">no seu Bolso</span>
          </h2>
          
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Para receber os alertas biológicos do seu jejum, instale o PrimalBase no seu celular agora.
          </p>

          <div className="w-full bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50 mb-6">
            
            {deviceInfo === 'ios-safari' && (
              <div className="flex flex-col gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-800 p-2 rounded-lg text-amber-500 shrink-0">
                    <Share className="w-5 h-5" />
                  </div>
                  <p className="text-zinc-300 text-sm">
                    <strong>1.</strong> Toque em <strong className="text-white">Compartilhar</strong> na barra inferior.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-800 p-2 rounded-lg text-amber-500 font-bold font-serif text-lg leading-none w-9 h-9 flex items-center justify-center shrink-0">
                    +
                  </div>
                  <p className="text-zinc-300 text-sm">
                    <strong>2.</strong> Selecione <strong className="text-white">Adicionar à Tela de Início</strong>.
                  </p>
                </div>
              </div>
            )}

            {deviceInfo === 'android' && (
              <div className="flex flex-col gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-800 p-2 rounded-lg text-amber-500 shrink-0">
                    <MoreVertical className="w-5 h-5" />
                  </div>
                  <p className="text-zinc-300 text-sm">
                    <strong>1.</strong> Toque nos <strong className="text-white">Três Pontinhos</strong> no topo.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-800 p-2 rounded-lg text-amber-500 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <p className="text-zinc-300 text-sm">
                    <strong>2.</strong> Selecione <strong className="text-white">Adicionar à tela inicial</strong>.
                  </p>
                </div>
              </div>
            )}

            {deviceInfo === 'ios-other' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <Compass className="w-8 h-8 text-amber-500 mb-2" />
                <p className="text-zinc-300 text-sm">
                  A Apple bloqueia instalações por aqui.
                </p>
                <p className="text-amber-500 text-sm font-bold mt-1">
                  Abra o site no SAFARI para instalar.
                </p>
              </div>
            )}

          </div>

          <button 
            onClick={handleDismiss}
            className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider text-sm"
          >
            Entendi, vou instalar
          </button>
        </div>
      </div>
    </div>
  );
}