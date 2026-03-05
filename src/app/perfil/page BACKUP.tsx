'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Adicionamos o ShieldAlert aqui 👇
import { LogOut, User as UserIcon, Edit3, X, CreditCard, Smartphone, MessageCircle, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast, Toaster } from 'sonner';
import confetti from 'canvas-confetti';

// Adicionamos o is_admin na interface 👇
interface Profile {
  full_name: string;
  gender: string;
  current_weight: number;
  height: number;
  goal: string;
  is_subscriber?: boolean;
  is_admin?: boolean; 
}

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Estados do formulário de edição
  const [editForm, setEditForm] = useState({
    full_name: '',
    gender: '',
    current_weight: 0,
    height: 0,
    goal: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const url = new URL(window.location.href);
      const success = url.searchParams.get('success');

      if (success === 'true') {
        setShowSuccessModal(true);

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
        });

        url.searchParams.delete('success');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (error) {
      console.error('Erro ao processar parâmetro de sucesso:', error);
    }
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');

      // Buscar perfil na tabela profiles
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
      } else {
        setProfile(profileData);
        // Preencher formulário com dados atuais
        setEditForm({
          full_name: profileData?.full_name || '',
          gender: profileData?.gender || '',
          current_weight: profileData?.current_weight || 0,
          height: profileData?.height || 0,
          goal: profileData?.goal || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  }

  function openEditModal() {
    // Atualizar formulário com dados atuais antes de abrir
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        gender: profile.gender || '',
        current_weight: profile.current_weight || 0,
        height: profile.height || 0,
        goal: profile.goal || ''
      });
    }
    setIsModalOpen(true);
  }

  function closeEditModal() {
    setIsModalOpen(false);
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Faça login para gerenciar sua assinatura.');
        return;
      }
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao abrir portal.');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('URL do portal não retornada.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao abrir portal de assinatura.');
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Preparar dados para upsert
      const updates = {
        id: user.id,
        full_name: editForm.full_name,
        gender: editForm.gender,
        current_weight: editForm.current_weight,
        height: editForm.height,
        goal: editForm.goal,
        updated_at: new Date().toISOString()
      };

      // Usar UPSERT para garantir que funcione mesmo se perfil não existir
      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' });

      if (error) {
        console.error('Erro detalhado ao atualizar perfil:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast.error('Erro ao atualizar: ' + (error.message || 'Erro desconhecido'));
        return;
      }

      // Atualizar estado local (preserva is_subscriber e is_admin)
      setProfile(prev => prev ? {
        ...prev,
        full_name: editForm.full_name,
        gender: editForm.gender,
        current_weight: editForm.current_weight,
        height: editForm.height,
        goal: editForm.goal
      } : null);

      // Fechar modal e mostrar toast
      closeEditModal();
      toast.success('Perfil atualizado com sucesso!');
      
    } catch (error: any) {
      console.error('Erro detalhado:', error.message || error);
      toast.error('Erro ao atualizar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  }

  function getGenderIcon() {
    if (!profile) return '🦁';
    
    const gender = profile.gender?.toLowerCase() || '';
    
    if (gender.includes('feminino') || gender.includes('leoa')) {
      return '🐆';
    }
    
    return '🦁';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-zinc-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" theme="dark" />
      
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col pb-24">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h1 className="text-2xl font-bold text-amber-500">Perfil</h1>
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-zinc-400" />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 py-6 space-y-8">
          {/* Topo - Identidade */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-zinc-50">
              {profile?.full_name || 'Usuário'}
            </h2>
            <p className="text-sm text-zinc-500">{email}</p>
          </div>

          {/* Botão de Edição e Gerenciar Assinatura */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={openEditModal}
              className="flex items-center gap-2 px-6 py-2.5 bg-transparent border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-300"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-medium">Editar Dados</span>
            </button>
            {profile?.is_subscriber && (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 border border-amber-500/30 text-amber-500 rounded-lg hover:bg-zinc-800 hover:border-amber-500 transition-all duration-300 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">{portalLoading ? 'Redirecionando...' : 'Gerenciar Assinatura'}</span>
              </button>
            )}
          </div>

          {/* Bloco de Dados Biológicos - Grid 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            {/* Card Gênero */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
              <div className="text-4xl">{getGenderIcon()}</div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Gênero</p>
                <p className="text-base font-semibold text-zinc-200 mt-1">
                  {profile?.gender || 'Não informado'}
                </p>
              </div>
            </div>

            {/* Card Peso */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
              <div className="text-3xl font-bold text-amber-500">
                {profile?.current_weight || 0}
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Peso</p>
                <p className="text-base font-semibold text-zinc-200 mt-1">kg</p>
              </div>
            </div>

            {/* Card Altura */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
              <div className="text-3xl font-bold text-amber-500">
                {profile?.height || 0}
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Altura</p>
                <p className="text-base font-semibold text-zinc-200 mt-1">cm</p>
              </div>
            </div>

            {/* Card Meta */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
              <div className="text-2xl">🎯</div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Meta</p>
                <p className="text-sm font-semibold text-zinc-200 mt-1 leading-tight">
                  {profile?.goal || 'Não definida'}
                </p>
              </div>
            </div>
          </div>

          {/* Área de Ação - Rodapé */}
          <div className="pt-8 space-y-4">
            
            {/* 🛡️ BOTÃO SECRETO ADMIN - Aparece apenas para você! 🛡️ */}
            {profile?.is_admin && (
              <button
                onClick={() => router.push('/admin')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-500 rounded-xl hover:bg-amber-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(251,191,36,0.1)]"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-2.5 rounded-lg flex-shrink-0">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold uppercase tracking-widest text-sm block">Sala de Comando</span>
                    <span className="text-zinc-500 text-xs font-medium">Painel de Administração</span>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-500 text-black px-2 py-1 rounded-md font-black tracking-widest">ADMIN</span>
              </button>
            )}
            {/* BOTÃO DE SUPORTE WHATSAPP */}
            <a 
              href="https://wa.me/5531997374012?text=Ol%C3%A1%2C+sou+guerreiro+da+PrimalBase+e+preciso+de+suporte!" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center gap-4 p-4 mt-3 bg-zinc-900/40 hover:bg-green-500/10 border border-zinc-800 hover:border-green-500/40 rounded-xl text-left transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] shadow-sm cursor-pointer"
            >
              <div className="bg-green-500/10 p-2.5 rounded-lg flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-zinc-200 font-semibold text-base">Central de Suporte</h3>
                <p className="text-zinc-500 text-sm">Fale diretamente com nossa equipe no WhatsApp</p>
              </div>
            </a>

            <button
              onClick={handleLogout}
              className="w-full bg-transparent border-2 border-red-500/50 text-red-500 rounded-xl py-4 px-6 font-semibold hover:bg-red-500/10 hover:border-red-500 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <LogOut className="w-5 h-5" />
              Sair da Conta
            </button>
          </div>
        </main>
      </div>

      {/* Modal de Sucesso Premium */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-zinc-900 border border-amber-500/30 rounded-2xl p-8 text-center shadow-2xl shadow-amber-500/20 transform scale-100 animate-in zoom-in-95 duration-300">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 rounded-full p-4 border-4 border-zinc-950 shadow-xl">
              <span className="text-5xl">🦁</span>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold text-white">Bem-vindo à Tribo!</h2>
            <p className="mt-3 text-zinc-400">
              Seu acesso <span className="text-amber-500 font-semibold">Premium</span> foi liberado com sucesso. Agora você tem controle total da sua evolução.
            </p>
            <div className="mt-8 space-y-3">
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-amber-500/25"
              >
                Começar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <h3 className="text-xl font-bold text-zinc-50">Editar Perfil</h3>
              <button
                onClick={closeEditModal}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Formulário com padding-bottom generoso */}
            <div className="p-6 space-y-5 pb-32">
              {/* Nome Completo */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Digite seu nome completo"
                />
              </div>

              {/* Gênero */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Gênero
                </label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>

              {/* Peso */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  value={editForm.current_weight}
                  onChange={(e) => setEditForm({ ...editForm, current_weight: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ex: 80"
                  min="0"
                  step="0.1"
                />
              </div>

              {/* Altura */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  value={editForm.height}
                  onChange={(e) => setEditForm({ ...editForm, height: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ex: 180"
                  min="0"
                  step="1"
                />
              </div>

              {/* Meta */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Meta
                </label>
                <select
                  value={editForm.goal}
                  onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  <option value="Perca de Gordura">Perca de Gordura</option>
                  <option value="Ganho de Massa">Ganho de Massa</option>
                </select>
              </div>
            </div>

            {/* Footer do Modal - Sticky para sempre visível */}
            <div className="p-6 border-t border-zinc-800 flex gap-3 sticky bottom-0 bg-zinc-900">
              <button
                onClick={closeEditModal}
                className="flex-1 bg-transparent border border-zinc-700 text-zinc-300 rounded-lg py-3 px-4 font-medium hover:bg-zinc-800 transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg py-3 px-4 font-semibold hover:from-amber-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

            {/* Espaçador físico para empurrar botões acima da Navbar */}
            <div className="h-24 w-full shrink-0"></div>
          </div>
        </div>
      )}
    </>
  );
}