'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // 👈 Importação da Rota de Extração
import { supabase } from '@/lib/supabase';
import { Send, History, CheckCircle2, XCircle, Crosshair, ArrowLeft } from 'lucide-react'; // 👈 Seta adicionada aqui

interface PushLog {
  id: string;
  created_at: string;
  robo_origem: string;
  titulo: string;
  mensagem: string;
  total_alvos: number;
  alvos_ids: string[];
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
  const [filtroLog, setFiltroLog] = useState('todos'); 

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

  const handleLimparHistorico = async () => {
    const confirmar = confirm('⚠️ ATENÇÃO: Isso vai apagar TODOS os registros de disparos passados do banco de dados. Deseja incinerar o histórico?');
    if (!confirmar) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('push_logs').delete().not('id', 'is', null);
      
      if (!error) {
        setLogs([]);
        alert('🔥 Histórico incinerado com sucesso!');
      } else {
        alert('Erro ao limpar histórico.');
      }
    } catch (err) {
      alert('Falha ao comunicar com o banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  const logsFiltrados = logs.filter(log => {
    if (filtroLog === 'todos') return true;
    if (filtroLog === 'manual') return log.robo_origem.includes('DISPARO');
    if (filtroLog === 'automatico') return !log.robo_origem.includes('DISPARO');
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-zinc-950 min-h-screen text-white font-sans">
      <header className="border-b border-zinc-800 pb-4">
        {/* 👇 Rota de Voltar para o QG Admin */}
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-amber-500 transition-colors mb-6 text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Voltar ao Painel
        </Link>
        
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
                <optgroup label="Filtros Gerais">
                  <option value="todos">Toda a Base (100%)</option>
                  <option value="secar">Objetivo: Perder Gordura</option>
                  <option value="ganho">Objetivo: Ganhar Massa</option>
                  <option value="especifico">Usuário Específico (E-mail) 🎯</option>
                </optgroup>
                <optgroup label="Filtros da Jornada">
                  <option value="jornada_veterano">✅ Concluíram os 21 Dias</option>
                  <option value="jornada_combate">⏳ Em Andamento (Dias 1 a 20)</option>
                  <option value="jornada_reserva">❌ Não Iniciada (Nunca fizeram nenhum dia)</option>
                </optgroup>
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
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <History size={20} className="text-amber-500" /> Histórico de Ataques
            </h2>
            
            <div className="flex items-center gap-3 w-full xl:w-auto">
              <select 
                value={filtroLog}
                onChange={(e) => setFiltroLog(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider rounded-lg px-3 py-2 outline-none focus:border-amber-500 flex-1 xl:flex-none cursor-pointer"
              >
                <option value="todos">👁️ Todas as Operações</option>
                <option value="manual">🎯 Só Disparos Manuais</option>
                <option value="automatico">🤖 Só Robôs Automáticos</option>
              </select>

              <button
                onClick={handleLimparHistorico}
                disabled={loading || logsFiltrados.length === 0}
                className="text-xs bg-zinc-950 hover:bg-red-950 text-zinc-500 hover:text-red-400 px-4 py-2 rounded-lg transition-all border border-zinc-800 hover:border-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider font-bold h-[34px]"
              >
                Incinerar Log
              </button>
            </div>
          </div>

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
                {logsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 italic">Nenhum tiro disparado ou encontrado no filtro atual.</td>
                  </tr>
                ) : (
                  logsFiltrados.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/20">
                      <td className="p-4 text-zinc-300 align-top">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 font-medium text-amber-500 whitespace-nowrap align-top">{log.robo_origem}</td>
                      
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