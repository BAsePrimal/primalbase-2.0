'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Rastreador() {
  useEffect(() => {
    const registrarPresenca = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Atualiza a coluna updated_at com a data e hora de AGORA
          await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error("Erro ao registrar presença", error);
      }
    };

    // Dá um delay de 2 segundos para não atrapalhar o carregamento do app
    const timer = setTimeout(() => {
      registrarPresenca();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null; // É invisível, não aparece nada na tela!
}