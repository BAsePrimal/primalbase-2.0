'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, History, CheckCircle2, XCircle, Crosshair } from 'lucide-react';

interface PushLog {
  id: string;
  created_at: string;
  robo_origem: string;
  titulo: string;
  mensagem: string;
  total_alvos: number;
  alvos_ids: string[]; // 👈 AGORA A INTERFACE PUXA OS IDs
  status: string;
  detalhes_erro: string;
}

export default function PushCommanderPage() {
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [segmento, setSegmento] = useState('todos');
  const [emailAlvo, setEmailAlvo] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<PushLog[]>([]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('push_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (!error && data) setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDisparo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !mensagem) return alert('Preencha título e mensagem!');
    if (segmento === 'especifico' && !emailAlvo) return alert('Digite o e-mail do alvo!');
    
    const confirmar = confirm(`Tem certeza que deseja disparar para: ${segmento.toUpperCase()}?`);
    if (!confirmar) return;

    setLoading(true);
    try {
      // 👇 O DISPARO VAI CHAMAR O MOTOR LÁ NA PASTA /API/ (COMO EXPLIQUEI ACIMA)
      const res = await fetch('/api/admin/push-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, mensagem, segmento, emailAlvo })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`💥 Fogo efetuado! ${data.alvos} alvos atingidos.`);
        setTitulo('');
        setMensagem('');
        setEmailAlvo('');
        fetchLogs(); 
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err) {
      alert('Falha na conexão com o sistema de artilharia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-zinc-950 min-h-screen text-white font-sans">
      <header className="border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-black text-amber-500 flex items-center gap-3">
          <Crosshair className="w-8 h-8" /> 
          Centro de Comando (Push)
        </h1>
        <p className="text-zinc-400 mt-2">Artilharia Manual e Radar de Intervenções da PrimalBase.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <Send size={20} className="text-amber-500" /> Disparo Manual
          </h2>
          
          <form onSubmit={handleDisparo} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Segmento Alvo</label>
              <select 
                value={segmento} 
                onChange={(e) => setSegmento(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
              >
                <option value="todos">Toda a Base (100%)</option>
                <option value="secar">Esquadrão Secar (Perda)</option>
                <option value="ganho">Esquadrão Crescer (Ganho)</option>
                <option value="especifico">Usuário Específico (Sniper) 🎯</option>
              </select>
            </div>

            {segmento === 'especifico' && (
              <div>
                <label className="block text-xs font-bold text-amber-500 uppercase mb-2">E-mail do Alvo</label>
                <input 
                  type="email" 
                  value={emailAlvo}
                  onChange={(e) => setEmailAlvo(e.target.value)}
                  placeholder="aluno@email.com"
                  className="w-full bg-zinc-950 border border-amber-500/50 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Título da Notificação</label>
              <input 
                type="text" 
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Oferta Relâmpago. ⚡"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Corpo da Mensagem</label>
              <textarea 
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Ex: A loja de suplementos está com desconto."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none min-h-[120px] resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-red-900/50"
            >
              {loading ? 'Preparando...' : 'DISPARAR AGORA 💥'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <History size={20} className="text-amber-500" /> Histórico de Ataques
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-400">
                <tr>
                  <th className="p-4 font-bold rounded-tl-lg">Data/Hora</th>
                  <th className="p-4 font-bold">Robô</th>
                  <th className="p-4 font-bold w-48">Impacto (Alvos)</th>
                  <th className="p-4 font-bold">Munição</th>
                  <th className="p-4 font-bold rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 italic">Nenhum tiro disparado ainda.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/20">
                      <td className="p-4 text-zinc-300 align-top">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 font-medium text-amber-500 whitespace-nowrap align-top">{log.robo_origem}</td>
                      
                      {/* 👇 AQUI ESTÁ A AUDITORIA DOS IDs 👇 */}
                      <td className="p-4 text-zinc-300 align-top">
                        <div className="font-mono bg-zinc-800 px-2 py-1 rounded inline-block mb-1">
                          {log.total_alvos} guerreiros
                        </div>
                        {log.alvos_ids && log.alvos_ids.length > 0 && (
                          <details className="text-[10px] text-zinc-500 mt-1 cursor-pointer group">
                            <summary className="hover:text-amber-500 transition-colors font-bold uppercase tracking-wider outline-none">
                              Auditar IDs
                            </summary>
                            <div className="mt-2 max-h-24 overflow-y-auto bg-zinc-950 p-2 rounded border border-zinc-800 break-all select-all font-mono">
                              {log.alvos_ids.join(', ')}
                            </div>
                          </details>
                        )}
                      </td>

                      <td className="p-4 text-zinc-300 align-top">
                        <strong>{log.titulo}</strong>
                        <div className="text-xs text-zinc-500 mt-1">{log.mensagem}</div>
                      </td>
                      <td className="p-4 align-top">
                        {log.status === 'sucesso' ? (
                          <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={14}/> OK</span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1"><XCircle size={14}/> ERRO</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}