'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Mic, Brain, Coffee, ShoppingBag, Droplets, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';

// 👇 VARIÁVEL MESTRE DO FREEMIUM 
const LIMITE_USOS_FREE = 3;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 👇 Estrutura das Perguntas Rápidas (Agora com Ícones Elegantes)
const QUICK_QUESTIONS = [
  { text: "O que comer no lugar do pão no café da manhã?", icon: Coffee },
  { text: "O que pedir no iFood sem inflamar o corpo?", icon: ShoppingBag },
  { text: "Qual é a diferença real entre manteiga e margarina?", icon: Droplets },
  { text: "Estou com muita vontade de comer doce. O que eu faço?", icon: Sparkles }
];

export default function ChatIAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isSubscriber, setIsSubscriber] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [totalChatsCount, setTotalChatsCount] = useState(0); 
  const [user, setUser] = useState<any>(null);

  const [isListening, setIsListening] = useState(false);
  const [hasMicSupport, setHasMicSupport] = useState(false);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    async function loadInitialData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        const { data: profile } = await supabase.from('profiles').select('is_subscriber, daily_free_usage, total_chats').eq('id', authUser.id).single();
        if (profile) {
          setIsSubscriber(profile.is_subscriber || false);
          setUsageCount(profile.daily_free_usage || 0);
          setTotalChatsCount(profile.total_chats || 0);
        }
      } else {
        const localUsage = localStorage.getItem('primalbase_free_credits');
        if (localUsage) setUsageCount(parseInt(localUsage, 10));
      }
    }
    loadInitialData();

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
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          }
          if (finalTranscript) setInput((prev) => (prev.trim() ? prev.trim() + ' ' : '') + finalTranscript.trim());
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleMicrophone = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); } 
    else { recognitionRef.current?.start(); setIsListening(true); }
  };

  const handleQuickQuestionClick = (question: string) => {
    setInput(question);
    processMessage(question); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await processMessage(input.trim());
  };

  const processMessage = async (messageText: string) => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }

    if (!isSubscriber && usageCount >= LIMITE_USOS_FREE) {
      setShowPaywall(true);
      return;
    }

    setInput(''); 
    const newMessages = [...messages, { role: 'user' as const, content: messageText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history: messages }),
      });

      if (!response.ok) throw new Error('Erro ao enviar mensagem');

      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);

      const nextCount = usageCount + 1;
      setUsageCount(nextCount);

      if (user) {
        const nextTotal = totalChatsCount + 1; 
        setTotalChatsCount(nextTotal); 
        await supabase.from('profiles').update({ daily_free_usage: nextCount, total_chats: nextTotal }).eq('id', user.id);
      } else {
        localStorage.setItem('primalbase_free_credits', nextCount.toString());
      }
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: 'Desculpe, tive um problema técnico. Tente novamente.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col pb-44">
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
          
          {/* 👇 ESTADO VAZIO: AGORA COM A GRADE CENTRALIZADA */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 space-y-12 animate-in fade-in duration-700">
              
              {/* Header do Estado Vazio */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 shadow-[0_0_30px_rgba(251,191,36,0.15)] flex items-center justify-center mx-auto relative overflow-hidden">
                  <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
                  <Brain className="w-10 h-10 text-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] relative z-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Oi, sou seu Mentor</h2>
                  <p className="text-zinc-400 max-w-[280px] md:max-w-sm mx-auto text-sm md:text-base leading-relaxed">
                    Pergunte sobre ingredientes, hábitos ou como otimizar sua rotina.
                  </p>
                </div>
              </div>

              {/* A Grade (Grid) de Perguntas Estilo Olive App */}
              <div className="w-full max-w-2xl px-2">
                <h3 className="text-zinc-400 font-bold mb-4 text-xs md:text-sm uppercase tracking-widest pl-2">
                  Perguntas rápidas
                </h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {QUICK_QUESTIONS.map((q, idx) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleQuickQuestionClick(q.text)}
                        disabled={isLoading}
                        className="text-left bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 hover:bg-zinc-800 hover:border-amber-500/50 transition-all active:scale-95 disabled:opacity-50 flex flex-col gap-3 shadow-sm hover:shadow-md group"
                      >
                        <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-colors">
                          <Icon className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="text-xs md:text-sm text-zinc-300 font-medium leading-snug group-hover:text-white transition-colors line-clamp-3">
                          {q.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Mensagens renderizadas */}
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-50 border border-zinc-700/50'
                }`}>
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap break-words text-sm md:text-base leading-snug">{message.content}</p>
                ) : (
                  <div className="prose prose-invert max-w-none text-gray-100 text-sm md:text-base whitespace-pre-wrap leading-relaxed">
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
      <div className="fixed bottom-20 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 p-4 z-40">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite ou fale sua dúvida..."
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-full pl-5 pr-12 py-3.5 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
                disabled={isLoading}
              />
              
              {hasMicSupport && (
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  disabled={isLoading}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                    isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-zinc-400 hover:text-white disabled:opacity-50'
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
              className="bg-amber-500 text-zinc-950 rounded-full p-3.5 hover:bg-amber-600 transition-colors disabled:opacity-50 flex-shrink-0 shadow-lg active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          
          {!isSubscriber && (
            <div className="flex flex-col items-center gap-1.5 mt-1">
              <div className="w-full max-w-[200px] h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${Math.min((usageCount / LIMITE_USOS_FREE) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">
                Créditos Gratuitos: {Math.max(LIMITE_USOS_FREE - usageCount, 0)} / {LIMITE_USOS_FREE}
              </p>
            </div>
          )}
        </div>
      </div>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} userId={user?.id || ''} />
    </div>
  );
}