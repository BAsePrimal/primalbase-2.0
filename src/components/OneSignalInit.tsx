'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalInit() {
  useEffect(() => {
    const initOneSignal = async () => {
      // Impede de rodar no servidor da Vercel ou se faltar a chave no .env
      if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return;
      
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          safari_web_id: "web.onesignal.auto.64337d6b-67cd-4296-b41c-d41bc6b4a874",
          allowLocalhostAsSecureOrigin: true,
          // A MÁGICA: Janela branca removida. O OneSignal agora age em silêncio.
        });
        console.log('🐺 Radar OneSignal ativado na matilha!');
      } catch (error) {
        console.error('Falha ao ligar o OneSignal:', error);
      }
    };

    initOneSignal();
  }, []);

  return null;
}