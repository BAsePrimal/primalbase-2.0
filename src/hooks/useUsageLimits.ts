import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UsageLimits {
  nutri_scanner_count: number;
  chef_criativo_count: number;
  especialista_count: number;
}

export function useUsageLimits(userId: string | null) {
  const [limits, setLimits] = useState<UsageLimits>({
    nutri_scanner_count: 0,
    chef_criativo_count: 0,
    especialista_count: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadLimits();
  }, [userId]);

  const loadLimits = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('ai_usage_limits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar limites:', error);
        return;
      }

      if (data) {
        setLimits({
          nutri_scanner_count: data.nutri_scanner_count || 0,
          chef_criativo_count: data.chef_criativo_count || 0,
          especialista_count: data.especialista_count || 0,
        });
      } else {
        // Criar registro inicial
        const { data: newData, error: insertError } = await supabase
          .from('ai_usage_limits')
          .insert({
            user_id: userId,
            nutri_scanner_count: 0,
            chef_criativo_count: 0,
            especialista_count: 0,
          })
          .select()
          .single();

        if (!insertError && newData) {
          setLimits({
            nutri_scanner_count: 0,
            chef_criativo_count: 0,
            especialista_count: 0,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar limites:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementLimit = async (type: 'nutri_scanner' | 'chef_criativo' | 'especialista') => {
    if (!userId) return false;

    try {
      const field = `${type}_count`;
      const newValue = limits[field as keyof UsageLimits] + 1;

      const { error } = await supabase
        .from('ai_usage_limits')
        .update({ [field]: newValue })
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao incrementar limite:', error);
        return false;
      }

      setLimits((prev) => ({
        ...prev,
        [field]: newValue,
      }));

      return true;
    } catch (error) {
      console.error('Erro ao incrementar limite:', error);
      return false;
    }
  };

  const canUse = (type: 'nutri_scanner' | 'chef_criativo' | 'especialista'): boolean => {
    const maxLimits = {
      nutri_scanner: 1,
      chef_criativo: 1,
      especialista: 3,
    };

    const field = `${type}_count`;
    return limits[field as keyof UsageLimits] < maxLimits[type];
  };

  return {
    limits,
    loading,
    incrementLimit,
    canUse,
    reload: loadLimits,
  };
}
