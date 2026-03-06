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
          
          // 👇 TRADUÇÃO COM O DELAY ADICIONADO PARA O TYPESCRIPT NÃO RECLAMAR 👇
          promptOptions: {
            slidedown: {
              prompts: [
                {
                  type: "push",
                  autoPrompt: false,
                  text: {
                    actionMessage: "Queremos te enviar alertas sobre o seu jejum e a sua evolução na alcateia.",
                    acceptButton: "Permitir",
                    cancelButton: "Agora Não"
                  },
                  delay: {
                    pageViews: 1,
                    timeDelay: 0
                  }
                }
              ]
            }
          }

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