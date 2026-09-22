'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Mic, Brain } from 'lucide-react';
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
  const [totalChatsCount, setTotalChatsCount] = useState(0); 
  const [user, setUser] = useState<any>(null);

  // --- ESTADOS DO MICROFONE (VOICE-TO-TEXT) ---
  const [isListening, setIsListening] = useState(false);
  const [hasMicSupport, setHasMicSupport] = useState(false);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Carrega o status do Assinante e a Memória de uso
  useEffect(() => {
    async function loadInitialData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        
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
      } else {
        // 👇 VISITANTE ANÓNIMO: Puxa a contagem de CRÉDITOS GLOBAIS da memória do telemóvel
        const localUsage = localStorage.getItem('primalbase_free_credits');
        if (localUsage) {
          setUsageCount(parseInt(localUsage, 10));
        }
      }
    }
    loadInitialData();

    // 2. Inicializa a Inteligência de Reconhecimento de Voz Nativa
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setHasMicSupport(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'pt-BR';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setInput((prev) => {
              const prefix = prev.trim() ? prev.trim() + ' ' : '';
              return prefix + finalTranscript.trim();
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Erro na captação de voz:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleMicrophone = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    // 👇 TRAVA DE SEGURANÇA GLOBAL (Limite de 5 usos no total)
    if (!isSubscriber && usageCount >= 5) {
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

      // 👇 ATUALIZA O CONTADOR (Supabase ou LocalStorage)
      const nextCount = usageCount + 1;
      setUsageCount(nextCount);

      if (user) {
        const nextTotal = totalChatsCount + 1; 
        setTotalChatsCount(nextTotal); 
        
        await supabase
          .from('profiles')
          .update({ 
            daily_chat_count: nextCount,
            total_chats: nextTotal 
          })
          .eq('id', user.id);
      } else {
        localStorage.setItem('primalbase_free_credits', nextCount.toString());
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
      {/* Header Minimalista */}
      <header className="flex items-center px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <Link href="/">
          <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-medium">
            <ArrowLeft className="w-6 h-6" />
            <span className="text-lg">Voltar</span>
          </button>
        </Link>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          
          {/* 👇 ESTADO VAZIO (UI PREMIUM E PROFISSIONAL) */}
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 shadow-[0_0_30px_rgba(251,191,36,0.15)] flex items-center justify-center mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
                <Brain className="w-12 h-12 text-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] relative z-10" />
              </div>
              
              <div>
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mb-3 tracking-tight">
                  Mentor de Alimentação
                </h2>
                <p className="text-zinc-300 max-w-sm mx-auto font-medium text-base md:text-lg leading-relaxed">
                  Tire suas dúvidas sobre o que comer e como otimizar sua rotina diária.
                </p>
              </div>
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
                <span className="text-zinc-400 text-sm">Consultando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-20 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 p-4 z-50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-center">
            
            {/* Wrapper Relativo para Input + Microfone */}
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite ou fale sua dúvida..."
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-full pl-6 pr-14 py-3 focus:outline-none focus:ring-1 focus:ring-amber-500"
                disabled={isLoading}
              />
              
              {/* BOTÃO DO MICROFONE */}
              {hasMicSupport && (
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  disabled={isLoading}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                    isListening 
                      ? 'bg-red-500/20 text-red-500 animate-pulse' 
                      : 'text-zinc-400 hover:text-white disabled:opacity-50'
                  }`}
                  title={isListening ? "Parar gravação" : "Ditar mensagem"}
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-amber-500 text-zinc-950 rounded-full p-3 hover:bg-amber-600 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* 👇 BARRA DE CRÉDITOS GLOBAIS */}
          {!isSubscriber && (
            <div className="mt-3 flex flex-col items-center gap-1">
              <div className="w-full max-w-[200px] h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${Math.min((usageCount / 5) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">
                Créditos Gratuitos: {Math.max(5 - usageCount, 0)} / 5
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