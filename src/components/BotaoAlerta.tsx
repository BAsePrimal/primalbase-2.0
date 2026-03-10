'use client';

import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { Bell, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BotaoAlerta() {
  const [inscrito, setInscrito] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const sincronizarComBanco = async () => {
    try {
      const onesignalId = OneSignal.User.PushSubscription.id;
      if (!onesignalId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ onesignal_id: onesignalId })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Erro ao sincronizar', err);
    }
  };

  useEffect(() => {
    const verificarStatus = setTimeout(() => {
      if (typeof window !== 'undefined' && OneSignal.Notifications) {
        const temPermissao = OneSignal.Notifications.permission;
        setInscrito(temPermissao);
        if (temPermissao) {
          sincronizarComBanco();
        }
      }
    }, 1500);
    return () => clearTimeout(verificarStatus);
  }, []);

  const pedirPermissao = async () => {
    setCarregando(true);

    try {
      // 🔥 A MÁGICA TÁTICA: Grita para o nosso Modal Preto aparecer!
      window.dispatchEvent(new Event('forcePushModal'));

      // Fica vigiando para ver se o recruta aceitou o radar no modal e na Apple
      const vigia = setInterval(() => {
        const temPermissao = OneSignal.Notifications.permission;
        const temId = OneSignal.User && OneSignal.User.PushSubscription ? OneSignal.User.PushSubscription.id : null;

        if (temPermissao && temId) {
          setInscrito(true);
          setCarregando(false);
          sincronizarComBanco();
          clearInterval(vigia);
        } else if (temPermissao === false) {
          setCarregando(false);
          clearInterval(vigia);
        }
      }, 1000);

      // Aumentamos o tempo limite para 45s porque o usuário vai ler o nosso Modal primeiro
      setTimeout(() => {
        clearInterval(vigia);
        setCarregando(false);
      }, 45000);

    } catch (error) {
      console.error("Erro ao solicitar:", error);
      setCarregando(false);
    }
  };

  if (inscrito) {
    return (
      <div className="w-full flex items-center justify-center gap-3 p-4 bg-emerald-950/30 border border-emerald-500/50 rounded-xl text-emerald-400 text-sm font-medium shadow-lg shadow-emerald-900/10 transition-all">
        <CheckCircle className="w-5 h-5 text-emerald-500" />
        <span>Radar Ativado: Conectado à Matilha</span>
      </div>
    );
  }

  return (
    <button
      onClick={pedirPermissao}
      disabled={carregando}
      className={`w-full flex items-center justify-between p-4 bg-zinc-900 border ${carregando ? 'border-amber-500 bg-zinc-800' : 'border-amber-500/30'} rounded-xl hover:bg-zinc-800 hover:border-amber-500 transition-all duration-300 group shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
          {carregando ? (
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          ) : (
            <Bell className="w-5 h-5 text-amber-500" />
          )}
        </div>
        <div className="flex flex-col items-start text-left">
          <span className="text-zinc-100 font-bold text-sm">
            {carregando ? 'Conectando Radar...' : 'Ativar Alertas da Matilha'}
          </span>
          <span className="text-zinc-500 text-xs">Avisos e progressos da sua jornada</span>
        </div>
      </div>
      {!carregando && <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>}
    </button>
  );
}