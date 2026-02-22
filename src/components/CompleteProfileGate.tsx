'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export default function CompleteProfileGate() {
  const [loading, setLoading] = useState(true);
  const [showGate, setShowGate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [form, setForm] = useState({
    gender: '',
    current_weight: '',
    height: '',
    goal: ''
  });

  useEffect(() => {
    checkProfile();
  }, []);

  async function checkProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('gender, current_weight, height, goal')
        .eq('id', user.id)
        .single();

      if (
        !profile || 
        !profile.gender || 
        !profile.goal || 
        !profile.current_weight || profile.current_weight <= 0 || 
        !profile.height || profile.height <= 0
      ) {
        setShowGate(true);
      }
    } catch (error) {
      console.error("Erro ao checar perfil:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.gender || !form.goal || !form.current_weight || !form.height) {
      toast.error("Preencha todos os campos para liberar seu acesso.");
      return;
    }

    setSaving(true);
    try {
      const updates = {
        id: userId,
        gender: form.gender,
        current_weight: parseFloat(form.current_weight),
        height: parseFloat(form.height),
        goal: form.goal,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      setShowGate(false); 
      window.location.reload(); 
    } catch (error: any) {
      toast.error("Erro ao salvar: " + (error.message || 'Tente novamente.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !showGate) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      
      <form 
        onSubmit={handleSave} 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        
        <div className="p-6 border-b border-zinc-800 flex flex-col items-center text-center shrink-0 bg-zinc-900">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-zinc-50">Complete seu Perfil</h3>
          <p className="text-zinc-400 text-sm mt-1">
            Precisamos desses dados para montar o seu protocolo.
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Gênero</label>
            <select
              required
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Selecione</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Peso (kg)</label>
              <input
                required
                type="number"
                value={form.current_weight}
                onChange={(e) => setForm({ ...form, current_weight: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: 80"
                min="0"
                step="0.1"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Altura (cm)</label>
              <input
                required
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: 180"
                min="0"
                step="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Meta</label>
            <select
              required
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Selecione</option>
              <option value="Perca de Gordura">Perca de Gordura</option>
              <option value="Ganho de Massa">Ganho de Massa</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 shrink-0 bg-zinc-900 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.3)]">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl py-4 font-semibold text-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar e Acessar'}
          </button>
        </div>

      </form>
    </div>
  );
}