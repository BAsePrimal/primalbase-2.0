'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVirtualizer } from '@tanstack/react-virtual';
import { supabase } from '@/lib/supabase';
import { Users, Crown, Activity, Utensils, ScanSearch, MessageSquare, ShieldAlert, ArrowLeft, Trophy, Loader2, Search, Filter, Calendar, Eye, Bot, AlertTriangle, X, Download, Phone } from 'lucide-react';

interface Profile {
  id: string;
  email?: string;
  full_name: any;
  whatsapp?: string;
  gender: any;
  goal: any;
  current_weight?: any;
  height?: any;
  is_subscriber: boolean;
  daily_scan_count: any;
  daily_recipe_count: any;
  daily_chat_count: any;
  total_scans?: number;
  total_recipes?: number;
  total_chats?: number;
  created_at?: any;
  updated_at?: any;
  progress?: number;
  last_checkin?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'vip' | 'free' | 'elite' | 'perdidos'>('todos');
  
  // 👇 NOVO ESTADO: Controla qual Ranking a tabela está mostrando
  const [sortBy, setSortBy] = useState<'alfabetica' | 'scans' | 'recipes' | 'chats'>('alfabetica');
  
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // 👇 REFERÊNCIA PARA VIRTUALIZAÇÃO 👇
  const parentRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    totalUsers: 0,
    vipUsers: 0,
    totalScans: 0,
    totalRecipes: 0,
    totalChats: 0
  });

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  async function checkAdminAndLoadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: adminCheck }: any = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (!adminCheck?.is_admin) {
        router.replace('/');
        return;
      }

      await fetchDashboardData();
    } catch (error) {
      router.replace('/');
    }
  }

  async function fetchDashboardData() {
    try {
      const { data: profilesData }: any = await supabase
        .from('profiles')
        .select('*');

      const { data: jornadaData }: any = await supabase
        .from('jornada_logs')
        .select('user_id, completed_at')
        .eq('status', 'concluido');

      const progressMap: Record<string, number> = {};
      const lastCheckinMap: Record<string, string> = {};

      jornadaData?.forEach((log: any) => {
        progressMap[log.user_id] = (progressMap[log.user_id] || 0) + 1;
        
        if (!lastCheckinMap[log.user_id] || new Date(log.completed_at) > new Date(lastCheckinMap[log.user_id])) {
          lastCheckinMap[log.user_id] = log.completed_at;
        }
      });

      const formattedUsers: Profile[] = (profilesData || []).map((p: any) => ({
        ...p,
        progress: progressMap[p.id] || 0,
        last_checkin: lastCheckinMap[p.id] || null
      }));

      setUsers(formattedUsers);

      setStats({
        totalUsers: formattedUsers.length,
        vipUsers: formattedUsers.filter(u => u.is_subscriber).length,
        totalScans: formattedUsers.reduce((acc, curr) => acc + (Number(curr.total_scans) || 0), 0),
        totalRecipes: formattedUsers.reduce((acc, curr) => acc + (Number(curr.total_recipes) || 0), 0),
        totalChats: formattedUsers.reduce((acc, curr) => acc + (Number(curr.total_chats) || 0), 0),
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleVip(userId: string, currentStatus: boolean) {
    if (!confirm(`Deseja alterar o VIP deste usuário?`)) return;

    try {
      await supabase
        .from('profiles')
        .update({ is_subscriber: !currentStatus })
        .eq('id', userId);

      setUsers(users.map(u => u.id === userId ? { ...u, is_subscriber: !currentStatus } : u));
      setStats(prev => ({
        ...prev,
        vipUsers: !currentStatus ? prev.vipUsers + 1 : prev.vipUsers - 1
      }));
      
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_subscriber: !currentStatus });
      }
    } catch (error) {
      alert('Erro ao atualizar VIP.');
    }
  }

  // 👇 LÓGICA DE FILTRO + ORDENAÇÃO (RANKING) 👇
  const filteredAndSortedUsers = useMemo(() => {
    // Primeiro: Filtra quem deve aparecer na tela
    let result = users.filter(user => {
      const matchesSearch = 
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        user.id.includes(searchTerm) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.whatsapp || '').includes(searchTerm);
      
      if (!matchesSearch) return false;
      if (filterType === 'vip') return user.is_subscriber;
      if (filterType === 'free') return !user.is_subscriber;
      if (filterType === 'elite') return user.progress === 21;
      if (filterType === 'perdidos') {
        if (!user.last_checkin) return true;
        const diffTime = Math.abs(new Date().getTime() - new Date(user.last_checkin).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 3;
      }
      return true;
    });

    // Segundo: Ordena a lista com base no card clicado lá no topo
    if (sortBy === 'scans') {
      result.sort((a, b) => (Number(b.total_scans) || 0) - (Number(a.total_scans) || 0));
    } else if (sortBy === 'recipes') {
      result.sort((a, b) => (Number(b.total_recipes) || 0) - (Number(a.total_recipes) || 0));
    } else if (sortBy === 'chats') {
      result.sort((a, b) => (Number(b.total_chats) || 0) - (Number(a.total_chats) || 0));
    } else {
      // Padrão: Ordem alfabética
      result.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    }

    return result;
  }, [users, searchTerm, filterType, sortBy]);

  // 👇 MOTOR DE VIRTUALIZAÇÃO CONFIGURADO 👇
  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 90, // Altura estimada de cada linha em pixels
    overscan: 10, // Quantas linhas carregar "abaixo do scroll" para suavidade
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não registrada';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  // 👇 NOVO VISUAL DA BARRA DE CONSUMO (Tudo separado e claro) 👇
  const renderAiCostBar = (value: number, limit: number, label: string, totalValue: number = 0) => {
    const percentage = Math.min((value / limit) * 100, 100);
    const isDanger = value >= limit;
    
    return (
      <div className="mb-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80">
        
        {/* Linha do Histórico Total */}
        <div className="flex justify-between items-start mb-4 border-b border-zinc-800/50 pb-3">
          <div>
            <span className="text-zinc-300 font-black uppercase tracking-wider text-sm">{label}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-0.5">Uso Vitalício</span>
            <span className="text-lg font-black text-amber-500 leading-none">{totalValue}</span>
          </div>
        </div>

        {/* Linha da Cota de Hoje */}
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Cota Usada (Hoje)</span>
            <span className={isDanger ? 'text-red-500 font-black flex items-center gap-1 text-xs' : 'text-zinc-300 font-bold text-xs'}>
              {value} / {limit} {isDanger && <AlertTriangle className="w-3 h-3" />}
            </span>
          </div>
          <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className={`h-full transition-all duration-1000 ${isDanger ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-amber-500'}`} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

      </div>
    );
  };

  const exportToCSV = () => {
    const headers = ['Id_Usuario', 'Nome', 'Email', 'WhatsApp', 'Status', 'Progresso', 'Scans_Total', 'Receitas_Total', 'Chats_Total', 'Ultimo Check-in'];
    
    const csvData = filteredAndSortedUsers.map(user => [
      user.id,
      `"${user.full_name || 'Guerreiro Sem Nome'}"`,
      user.email || 'Sem Email',
      user.whatsapp || 'Sem Número',
      user.is_subscriber ? 'Premium' : 'Gratuito',
      `${user.progress || 0}/21`,
      user.total_scans || 0,
      user.total_recipes || 0,
      user.total_chats || 0,
      user.last_checkin ? new Date(user.last_checkin).toLocaleDateString('pt-BR') : 'Sem registro'
    ]);

    const csvContent = [
      headers.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Alcateia_PrimalBase_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openWhatsApp = (numeroOriginal: string) => {
    const numeroLimpo = numeroOriginal.replace(/\D/g, '');
    const numeroFinal = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
    window.open(`https://wa.me/${numeroFinal}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-amber-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest text-xs uppercase">Sincronizando Alcateia...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8">
      {/* HEADER ATUALIZADO COM O BOTÃO DO PAINEL DE ERROS */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-colors shadow-lg">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-amber-500" />
              PRIMAL<span className="text-amber-500">ADMIN</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Sala de Controle Operacional</p>
          </div>
        </div>

        {/* 👇 BOTÃO DO ALARME 👇 */}
        <div className="flex items-center">
          <Link 
            href="/admin/erros" 
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 hover:scale-105 transition-all font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          >
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            Painel de Erros
          </Link>
        </div>
      </header>

      {/* DASHBOARD GRIDS - AGORA COM RANKING CLICÁVEL */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
        <StatCard icon={<Users className="text-blue-500" />} label="Total Guerreiros" value={stats.totalUsers} />
        
        <StatCard icon={<Crown className="text-amber-500" />} label="Assinantes VIP" value={stats.vipUsers} highlight />
        
        {/* 👇 Botões de Filtro de Ranking 👇 */}
        <StatCard 
          icon={<ScanSearch className="text-emerald-500" />} 
          label="Scans Totais (Ranking)" 
          value={stats.totalScans} 
          isActive={sortBy === 'scans'}
          onClick={() => setSortBy(sortBy === 'scans' ? 'alfabetica' : 'scans')} 
        />
        
        <StatCard 
          icon={<Utensils className="text-orange-500" />} 
          label="Receitas (Ranking)" 
          value={stats.totalRecipes} 
          isActive={sortBy === 'recipes'}
          onClick={() => setSortBy(sortBy === 'recipes' ? 'alfabetica' : 'recipes')} 
        />
        
        <StatCard 
          icon={<MessageSquare className="text-purple-500" />} 
          label="Chats (Ranking)" 
          value={stats.totalChats} 
          isActive={sortBy === 'chats'}
          onClick={() => setSortBy(sortBy === 'chats' ? 'alfabetica' : 'chats')} 
        />
      </div>

      {/* BARRA DE CONTROLE E EXPORTAÇÃO */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center backdrop-blur-md">
        
        {/* Busca */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar guerreiro..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Filtros e Botão Exportar */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Filtros */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            <Filter className="w-5 h-5 text-zinc-500 mr-2 shrink-0" />
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'vip', label: 'Só VIPs' },
              { id: 'free', label: 'Gratuitos' },
              { id: 'elite', label: 'Elite (21 Dias)' },
              { id: 'perdidos', label: 'Perdidos (+3 Dias)' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  filterType === f.id 
                  ? 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(251,191,36,0.3)]' 
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Botão Exportar CSV */}
          <button
            onClick={exportToCSV}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* 🔥 TABELA COM SCROLL HORIZONTAL BLINDADO PARA MOBILE 🔥 */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col h-[600px]">
        
        {/* ENVOLTÓRIO GLOBAL: Garante que Cabeçalho e Linhas rolam juntos no celular */}
        <div className="overflow-x-auto custom-scrollbar-horizontal flex-1 flex flex-col">
          {/* LARGURA MÍNIMA: Se a tela for menor que 800px, cria o scroll */}
          <div className="min-w-[800px] flex flex-col h-full">

            {/* CABEÇALHO FIXO DA TABELA */}
            <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/80">
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="p-5 w-[25%]">Membro</th>
                    <th className="p-5 w-[20%]">Fisiologia</th>
                    <th className="p-5 w-[15%] text-center">Progresso</th>
                    <th className="p-5 w-[20%] text-center">
                      IA (Total) {sortBy !== 'alfabetica' && <span className="text-amber-500 ml-1">▼ RANKING</span>}
                    </th>
                    <th className="p-5 w-[20%] text-center">Ações Rápidas</th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* CORPO DA TABELA COM SCROLL INFINITO (VIRTUALIZADO) */}
            <div 
              ref={parentRef} 
              className="flex-1 overflow-y-auto custom-scrollbar"
              style={{ contain: 'strict' }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const user = filteredAndSortedUsers[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="flex items-center border-b border-zinc-800/30 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* COLUNA 1: Membro */}
                      <div className="p-5 w-[25%]">
                        <div className="font-bold text-zinc-100 capitalize text-sm truncate">{user.full_name || 'Guerreiro Sem Nome'}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span className="text-[10px] text-zinc-500 font-mono">{formatDate(user.created_at || user.updated_at)}</span>
                        </div>
                      </div>
                      
                      {/* COLUNA 2: Fisiologia */}
                      <div className="p-5 w-[20%]">
                        <div className="text-xs font-semibold text-zinc-300 truncate">{user.goal || 'Meta Indefinida'}</div>
                        <div className="text-[10px] text-zinc-500 uppercase mt-1 truncate">
                          {user.gender || '—'} • {user.current_weight ? `${user.current_weight}kg` : ''}
                        </div>
                      </div>
                      
                      {/* COLUNA 3: Progresso */}
                      <div className="p-5 w-[15%]">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                             <span className={`text-xs font-black ${user.progress === 21 ? 'text-yellow-500' : 'text-zinc-400'}`}>
                               {user.progress}/21
                             </span>
                             {user.progress === 21 && <Trophy className="w-4 h-4 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]" />}
                          </div>
                          <div className="w-16 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                            <div 
                              className={`h-full transition-all duration-1000 ${user.progress === 21 ? 'bg-gradient-to-r from-yellow-500 to-amber-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-amber-600'}`}
                              style={{ width: `${(Number(user.progress) / 21) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* COLUNA 4: IA (Total) */}
                      <div className="p-5 w-[20%] text-center">
                        <div className="flex items-center justify-center gap-3 text-xs font-mono font-bold">
                          <div title="Scans Totais" className={`flex items-center gap-1 ${sortBy === 'scans' ? 'text-amber-500 scale-110' : 'text-zinc-500'}`}>
                            <ScanSearch className={`w-4 h-4 ${sortBy === 'scans' ? 'text-amber-500' : 'text-emerald-500/50'}`}/> 
                            {user.total_scans || 0}
                          </div>
                          <div title="Receitas Totais" className={`flex items-center gap-1 ${sortBy === 'recipes' ? 'text-amber-500 scale-110' : 'text-zinc-500'}`}>
                            <Utensils className={`w-4 h-4 ${sortBy === 'recipes' ? 'text-amber-500' : 'text-orange-500/50'}`}/> 
                            {user.total_recipes || 0}
                          </div>
                          <div title="Dúvidas Totais" className={`flex items-center gap-1 ${sortBy === 'chats' ? 'text-amber-500 scale-110' : 'text-zinc-500'}`}>
                            <MessageSquare className={`w-4 h-4 ${sortBy === 'chats' ? 'text-amber-500' : 'text-purple-500/50'}`}/> 
                            {user.total_chats || 0}
                          </div>
                        </div>
                      </div>

                      {/* COLUNA 5: Ações Rápidas */}
                      <div className="p-5 w-[20%] text-center flex items-center justify-center gap-3">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 bg-zinc-900 border border-zinc-700 text-amber-500 rounded-xl hover:bg-zinc-800 hover:text-amber-400 transition-all shadow-md group"
                          title="Ver Dossiê e IA"
                        >
                          <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>

                        <button
                          onClick={() => toggleVip(user.id, user.is_subscriber)}
                          className={`text-[10px] font-black px-4 py-2.5 rounded-xl transition-all uppercase tracking-tighter border whitespace-nowrap ${
                            user.is_subscriber 
                            ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10' 
                            : 'bg-amber-500 border-amber-400 text-black hover:bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:scale-105'
                          }`}
                        >
                          {user.is_subscriber ? 'Revogar VIP' : 'Ativar VIP'}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <div className="h-32 w-full"></div>

      {/* MODAL DOSSIÊ */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-2 md:p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-orange-600 shrink-0"></div>
            <div className="p-5 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-white truncate pr-2 uppercase tracking-tighter">
                  {selectedUser.full_name || 'Guerreiro'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-mono truncate">
                    ID: {selectedUser.id}
                   </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-zinc-800 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-all ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-zinc-900">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-2xl">
                  <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Bio-Medidas</p>
                  <p className="text-sm font-bold text-zinc-200">
                    {selectedUser.current_weight ? `${selectedUser.current_weight}kg` : '--'} | {selectedUser.height ? `${selectedUser.height}cm` : '--'}
                  </p>
                </div>
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${selectedUser.is_subscriber ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-950/50 border-zinc-800'}`}>
                  <div>
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Acesso</p>
                    <span className={`text-sm font-black ${selectedUser.is_subscriber ? 'text-amber-500' : 'text-zinc-500'}`}>
                      {selectedUser.is_subscriber ? 'PREMIUM' : 'FREE'}
                    </span>
                  </div>
                  {selectedUser.is_subscriber && <Crown className="w-5 h-5 text-amber-500" />}
                </div>
              </div>

              {selectedUser.whatsapp && (
                <button
                  onClick={() => openWhatsApp(selectedUser.whatsapp as string)}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] rounded-2xl transition-all font-bold tracking-wide group shadow-sm shadow-[#25D366]/5"
                >
                  <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Chamar Guerreiro no WhatsApp
                </button>
              )}

              <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Última Atividade</p>
                  <p className="text-xs text-zinc-200 font-medium truncate">{formatDate(selectedUser.last_checkin || '')}</p>
                </div>
              </div>

              {/* 👇 AQUI ESTÃO AS BARRAS DE CONSUMO COM O VISUAL NOVO 👇 */}
              <div>
                <div className="flex items-center gap-2 px-1 mb-3">
                  <Bot className="w-4 h-4 text-amber-500" />
                  <h4 className="font-black text-zinc-400 uppercase tracking-widest text-[10px]">Painel de Consumo IA</h4>
                </div>
                
                <div className="space-y-4">
                  {renderAiCostBar(Number(selectedUser.daily_recipe_count) || 0, 50, "Receitas (Chef)", Number(selectedUser.total_recipes) || 0)}
                  {renderAiCostBar(Number(selectedUser.daily_chat_count) || 0, 50, "Mensagens (Mentor)", Number(selectedUser.total_chats) || 0)}
                  {renderAiCostBar(Number(selectedUser.daily_scan_count) || 0, 50, "Análises (Scanner)", Number(selectedUser.total_scans) || 0)}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 shrink-0">
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 👇 O COMPONENTE DO CARD AGORA ACEITA CLIQUE PARA FILTRAR A TABELA 👇
function StatCard({ icon, label, value, highlight = false, onClick, isActive = false }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-3xl border transition-all duration-300 select-none ${onClick ? 'cursor-pointer' : ''} ${
        isActive 
          ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.2)] transform scale-[1.02]'
          : highlight 
          ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30 shadow-[0_0_30px_rgba(251,191,36,0.1)] hover:shadow-[0_0_40px_rgba(251,191,36,0.2)]' 
          : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800'
      }`}
    >
      <div className="mb-3 p-3 bg-zinc-950 rounded-2xl w-fit border border-zinc-800/50 shadow-inner">
        {icon}
      </div>
      <div className={`text-3xl font-black tracking-tighter ${isActive ? 'text-amber-400' : highlight ? 'text-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'text-white'}`}>
        {value}
      </div>
      <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isActive ? 'text-amber-500/80' : 'text-zinc-500'}`}>
        {label}
      </div>
    </div>
  );
}