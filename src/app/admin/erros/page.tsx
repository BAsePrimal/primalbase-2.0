'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, CheckCircle, Clock, ArrowLeft, Trash2 } from 'lucide-react';

interface ErrorLog {
  id: string;
  created_at: string;
  service_name: string;
  user_email: string | null;
  error_message: string;
  resolved: boolean;
}

export default function AdminErrosPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  }

  // 👇 A MÁGICA ACONTECE AQUI: Atualiza o banco e a tela na mesma hora
  async function toggleResolved(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('error_logs')
      .update({ resolved: !currentStatus })
      .eq('id', id);

    if (!error) {
      setLogs(logs.map(log => log.id === id ? { ...log, resolved: !currentStatus } : log));
    } else {
      alert('Erro ao atualizar o status no banco de dados.');
    }
  }

  async function deleteLog(id: string) {
    if (!confirm('Tem certeza que deseja apagar este registro de erro?')) return;
    
    const { error } = await supabase
      .from('error_logs')
      .delete()
      .eq('id', id);

    if (!error) {
      setLogs(logs.filter(log => log.id !== id));
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* CABEÇALHO */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-red-500 tracking-tighter flex items-center gap-2">
                <ShieldAlert className="w-7 h-7" />
                PAINEL DE PANE
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">
                Monitoramento da Caixa Preta
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 text-sm font-bold bg-zinc-900 p-3 rounded-xl border border-zinc-800">
            <div className="text-zinc-400">Total: <span className="text-white">{logs.length}</span></div>
            <div className="text-red-400">Pendentes: <span className="text-white">{logs.filter(l => !l.resolved).length}</span></div>
          </div>
        </header>

        {loading ? (
          <div className="text-center text-zinc-500 p-10 animate-pulse font-bold tracking-widest uppercase text-sm">
            Lendo Caixa Preta...
          </div>
        ) : (
          <div className="overflow-hidden border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-800">
                  <th className="p-5 w-48">Data / Hora</th>
                  <th className="p-5 w-48">Serviço Afetado</th>
                  <th className="p-5 w-48">Guerreiro (Usuário)</th>
                  <th className="p-5">Motivo Técnico</th>
                  <th className="p-5 text-center w-32">Status</th>
                  <th className="p-5 text-center w-48">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {logs.map((log) => (
                  <tr key={log.id} className={`transition-colors ${log.resolved ? 'bg-zinc-950/30' : 'hover:bg-zinc-800/30'}`}>
                    <td className="p-5 text-xs text-zinc-400 font-mono">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-5 font-bold text-zinc-200 text-sm">
                      {log.service_name}
                    </td>
                    <td className="p-5 text-sm text-amber-500 font-medium">
                      {log.user_email || 'Não identificado'}
                    </td>
                    <td className="p-5">
                      <div className="bg-black/60 p-3 rounded-lg max-h-24 overflow-y-auto break-words font-mono text-[11px] text-yellow-500/80 cursor-text border border-zinc-800/50 custom-scrollbar">
                        {log.error_message}
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      {log.resolved ? (
                        <span className="inline-flex items-center justify-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-emerald-400/10 rounded-lg border border-emerald-400/20 w-full">
                          <CheckCircle className="w-3 h-3" /> Resolvido
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 text-red-400 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-red-400/10 rounded-lg border border-red-400/20 w-full animate-pulse">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-2">
                        {/* 👇 O BOTÃO DE RESOLVER AQUI 👇 */}
                        <button
                          onClick={() => toggleResolved(log.id, log.resolved)}
                          className={`flex-1 px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all ${
                            log.resolved 
                            ? 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500' 
                            : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          }`}
                        >
                          {log.resolved ? 'Reabrir' : 'Dar Baixa'}
                        </button>

                        <button
                          onClick={() => deleteLog(log.id)}
                          className="p-2 bg-zinc-900 border border-zinc-700 text-zinc-500 rounded-lg hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                          title="Apagar Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-zinc-500">
                      <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                      <p className="text-lg font-bold text-zinc-400 uppercase tracking-widest">Nenhuma pane registrada</p>
                      <p className="text-sm mt-2">O motor do PrimalBase está rodando 100% liso. 🐺✨</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}