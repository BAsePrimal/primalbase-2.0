'use client';

import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { Bell, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BotaoAlerta() {
  const [inscrito, setInscrito] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // 🔥 O CAÇADOR: Função inteligente que pega o ID e joga no banco 🔥
  const sincronizarComBanco = async () => {
    try {
      const onesignalId = OneSignal.User.PushSubscription.id;
      if (!onesignalId) return; // Se a internet estiver lenta e não gerou, aborta

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ onesignal_id: onesignalId })
          .eq('id', user.id);
        
        if (!error) {
          console.log('🐺 ID do radar cravado no Supabase com sucesso!');
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar com Supabase', err);
    }
  };

  useEffect(() => {
    const verificarStatus = setTimeout(() => {
      if (typeof window !== 'undefined' && OneSignal.Notifications) {
        const temPermissao = OneSignal.Notifications.permission;
        setInscrito(temPermissao);
        
        // Se o guerreiro JÁ DEU permissão antes (seu caso), sincroniza agora!
        if (temPermissao) {
          sincronizarComBanco();
        }
      }
    }, 2000);

    return () => clearTimeout(verificarStatus);
  }, []);

  const pedirPermissao = async () => {
    setCarregando(true);
    try {
      await OneSignal.Slidedown.promptPush();
      
      // O VIGIA: Checa a cada 1 segundo se o cara clicou em "Permitir" (até 15 seg)
      let tentativas = 0;
      const vigia = setInterval(() => {
        tentativas++;
        const temPermissao = OneSignal.Notifications.permission;
        const temId = !!OneSignal.User.PushSubscription.id;

        if (temPermissao && temId) {
          setInscrito(true);
          setCarregando(false);
          sincronizarComBanco(); // Pega o ID e salva!
          clearInterval(vigia);
        } else if (tentativas > 15 || temPermissao === false) {
          // Desiste se demorar muito ou se ele clicar em "Agora Não"
          setCarregando(false);
          clearInterval(vigia);
        }
      }, 1000);

    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
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
        <div className="flex flex-col items-start">
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