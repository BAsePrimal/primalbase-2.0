'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatIAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Adiciona mensagem do usuário
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const data = await response.json();
      
      // Adiciona resposta da IA
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Erro:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col pb-32">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <Link href="/">
          <button className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
        </Link>
        <h1 className="text-lg font-semibold">Mentor Animal-Based</h1>
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
              <h2 className="text-xl font-bold text-amber-500">
                Mentor Animal-Based
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto">
                Nutrição Ancestral, Jejum e Bioquímica.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-50'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                ) : (
                  <div className="prose prose-invert max-w-none text-gray-100">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span className="text-zinc-400">Pensando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area - FIXO NA PARTE INFERIOR */}
      <div className="fixed bottom-20 left-0 right-0 bg-[#1a1a1a] border-t border-zinc-800 p-4 z-50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta sobre nutrição..."
              className="flex-1 bg-zinc-800 text-zinc-50 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-zinc-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-amber-500 text-zinc-950 rounded-full p-3 hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
