'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatIAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- ESTADOS DO PAYWALL E MEMÓRIA ---
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  // 👇 Nova variável do Odômetro Total
  const [totalChatsCount, setTotalChatsCount] = useState(0); 
  const [user, setUser] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Carrega o status do Assinante e a Memória de uso direto do SUPABASE
  useEffect(() => {
    async function loadInitialData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        
        // 👇 Agora ele puxa o total_chats também!
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_subscriber, daily_chat_count, total_chats')
          .eq('id', authUser.id)
          .single();
          
        if (profile) {
          setIsSubscriber(profile.is_subscriber || false);
          setUsageCount(profile.daily_chat_count || 0);
          setTotalChatsCount(profile.total_chats || 0);
        }
      }
    }
    loadInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // --- TRAVA DE SEGURANÇA (BLOQUEIA ANTES DE GASTAR) ---
    if (!isSubscriber && usageCount >= 3) {
      setShowPaywall(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });

      if (!response.ok) throw new Error('Erro ao enviar mensagem');

      const data = await response.json();
      
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);

      // --- ATUALIZA CONTADOR NO SUPABASE ---
      if (user) {
        const nextCount = usageCount + 1;
        const nextTotal = totalChatsCount + 1; // Odômetro sobe 1

        setUsageCount(nextCount); // Atualiza na tela
        setTotalChatsCount(nextTotal); // Atualiza na tela
        
        // 👇 Salva NO BANCO os dois contadores de uma vez
        await supabase
          .from('profiles')
          .update({ 
            daily_chat_count: nextCount,
            total_chats: nextTotal 
          })
          .eq('id', user.id);
      }

    } catch (error) {
      console.error('Erro:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Desculpe, tive um problema técnico. Tente novamente.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col pb-40">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <Link href="/">
          <button className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
        </Link>
        <h1 className="text-lg font-semibold text-amber-500">Mentor Animal-Based</h1>
        <div className="w-20"></div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <span className="text-3xl">🥩</span>
              </div>
              <h2 className="text-xl font-bold text-amber-500">Mentor Animal-Based</h2>
              <p className="text-zinc-400 max-w-md mx-auto italic">
                Sua IA especialista em dieta da selva e performance.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-50 border border-zinc-700/50'
                }`}>
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                ) : (
                  <div className="prose prose-invert max-w-none text-gray-100 text-sm whitespace-pre-wrap">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 border border-zinc-700/50 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span className="text-zinc-400 text-sm">Consultando ancestrais...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-20 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 p-4 z-50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Sua dúvida sobre nutrição..."
              className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-full px-6 py-3 focus:outline-none focus:ring-1 focus:ring-amber-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-amber-500 text-zinc-950 rounded-full p-3 hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {!isSubscriber && (
            <div className="mt-3 flex flex-col items-center gap-1">
              <div className="w-full max-w-[200px] h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${Math.min((usageCount / 3) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">
                Créditos: {Math.max(3 - usageCount, 0)} / 3
              </p>
            </div>
          )}
        </form>
      </div>

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        userId={user?.id || ''} 
      />
    </div>
  );
}