'use client';

import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { Bell, CheckCircle } from 'lucide-react';

export default function BotaoAlerta() {
  const [inscrito, setInscrito] = useState(false);

  useEffect(() => {
    const verificarStatus = setTimeout(() => {
      if (typeof window !== 'undefined' && OneSignal.Notifications) {
        setInscrito(OneSignal.Notifications.permission);
      }
    }, 2000);

    return () => clearTimeout(verificarStatus);
  }, []);

  const pedirPermissao = async () => {
    try {
      await OneSignal.Slidedown.promptPush();
      
      setTimeout(() => {
        setInscrito(OneSignal.Notifications.permission);
      }, 1000);
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
    }
  };

  if (inscrito) {
    return (
      <div className="w-full flex items-center justify-center gap-3 p-4 bg-emerald-950/30 border border-emerald-500/50 rounded-xl text-emerald-400 text-sm font-medium shadow-lg shadow-emerald-900/10">
        <CheckCircle className="w-5 h-5 text-emerald-500" />
        <span>Radar Ativado: Conectado à Matilha</span>
      </div>
    );
  }

  return (
    <button
      onClick={pedirPermissao}
      className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-amber-500/30 rounded-xl hover:bg-zinc-800 hover:border-amber-500 transition-all duration-300 group shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
          <Bell className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-zinc-100 font-bold text-sm">Ativar Alertas da Matilha</span>
          <span className="text-zinc-500 text-xs">Avisos e progressos da sua jornada</span>
        </div>
      </div>
      {/* Ponto de luz pulsante para atrair o clique */}
      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
    </button>
  );
}