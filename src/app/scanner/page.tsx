'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, Skull, RotateCcw, X, TriangleAlert, Lock, ChefHat, CheckCircle2, CircleDashed, Hourglass } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';

// 👇 VARIÁVEL MESTRE DO FREEMIUM (Mude aqui e a tela inteira se ajusta)
const LIMITE_USOS_FREE = 3;

interface ScanResult {
  verdict: 'ALLOWED' | 'BANNED' | 'WARNING';
  title: string;
  explanation: string;
  curiosity_fact?: string;
  clean_swap?: string; // 👇 Novo campo vindo da API
}

// --- ARMAS DE RETENÇÃO: MOTOR TÁTIL E SONORO NATIVO ---
const triggerFeedback = (type: 'success' | 'error' | 'warning') => {
  if (typeof window === 'undefined') return;

  if ('vibrate' in navigator) {
    if (type === 'error') {
      navigator.vibrate([200, 100, 300, 100, 400]); 
    } else if (type === 'warning') {
      navigator.vibrate([100, 50, 100]); 
    } else {
      navigator.vibrate([50, 50, 50]); 
    }
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'warning') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.setValueAtTime(400, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); 
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.error('Radar sonoro inativo:', e);
  }
};

export default function ScannerPage() {
  const router = useRouter(); // 👇 Para a Ponte do Chef
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [scanCount, setScanCount] = useState(0); 
  const [totalScansCount, setTotalScansCount] = useState(0);
  
  const [showCuriosityModal, setShowCuriosityModal] = useState(false);

  // 👇 Estados do Loader Dinâmico
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingPhrases, setLoadingPhrases] = useState<string[]>([]);

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser(authUser);
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_subscriber, daily_free_usage, total_scans')
          .eq('id', authUser.id)
          .single();
          
        if (profile) {
          setIsSubscriber(profile.is_subscriber || false);
          setScanCount(profile.daily_free_usage || 0);
          setTotalScansCount(profile.total_scans || 0); 
        }
      } else {
        const localUsage = localStorage.getItem('primalbase_free_credits');
        if (localUsage) {
          setScanCount(parseInt(localUsage, 10));
        }
      }
    };
    checkUserStatus();
  }, []);

  // 👇 Lógica do Checklist Dinâmico
  useEffect(() => {
    if (!isScanning) {
      setLoadingStep(0);
      return;
    }
    
    const pool = [
      "Rastreando açúcares ocultos e adoçantes artificiais...",
      "Analisando óleos de sementes e gorduras inflamatórias...",
      "Verificando conservantes, corantes e químicos industriais...",
      "Calculando o impacto no seu metabolismo e digestão..."
    ];
    const shuffled = pool.sort(() => 0.5 - Math.random());
    
    setLoadingPhrases([
      "Extraindo a lista de ingredientes e tabela nutricional...",
      shuffled[0],
      shuffled[1],
      "Buscando opções limpas e Troca Segura..."
    ]);

    setLoadingStep(1);
    const t1 = setTimeout(() => setLoadingStep(2), 1500);
    const t2 = setTimeout(() => setLoadingStep(3), 3000);
    const t3 = setTimeout(() => setLoadingStep(4), 4500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isScanning]);

  const handleCaptureClick = () => {
    if (!isSubscriber && scanCount >= LIMITE_USOS_FREE) {
      setShowPaywall(true);
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setIsScanning(true);
    setResult(null);

    try {
      const response = await fetch('/api/scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) {
        throw new Error('Erro ao analisar imagem');
      }

      const data = await response.json();
      setResult(data);

      if (data.verdict === 'ALLOWED') {
        triggerFeedback('success');
      } else if (data.verdict === 'WARNING') {
        triggerFeedback('warning');
      } else {
        triggerFeedback('error');
      }

      const nextCount = scanCount + 1;
      setScanCount(nextCount);

      if (user) {
        const nextTotal = totalScansCount + 1; 
        setTotalScansCount(nextTotal); 
        
        await supabase
          .from('profiles')
          .update({ 
            daily_free_usage: nextCount,
            total_scans: nextTotal
          })
          .eq('id', user.id);
      } else {
        localStorage.setItem('primalbase_free_credits', nextCount.toString());
      }

    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao analisar a imagem. Tente novamente.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black pb-32">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        
        {!isScanning && !result && (
          <div className="text-center mb-8 pt-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-white bg-clip-text text-transparent mb-3">
              Scanner IA
            </h1>
            <p className="text-gray-400 text-lg">
            Aponte para alimentos, pratos prontos ou cardápios.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center justify-center">
          
          {/* 👇 TELA DE CARREGAMENTO DINÂMICO */}
          {isScanning ? (
            <div className="w-full bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in fade-in duration-500">
              
              <div className="relative mb-6 rounded-2xl overflow-hidden border-2 border-amber-500/30">
                <img src={image!} alt="Processando" className="w-full h-48 object-cover opacity-60 grayscale-[30%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-black text-white mb-2 tracking-tight">Leitura de Rótulo</h3>
                  {/* Barra de Progresso Dinâmica */}
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-[1500ms] ease-linear"
                      style={{ width: `${(loadingStep / 4) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-2">
                {loadingPhrases.map((phrase, idx) => {
                  const stepNum = idx + 1;
                  const isPast = loadingStep > stepNum;
                  const isCurrent = loadingStep === stepNum;
                  const isFuture = loadingStep < stepNum;
                  const isLast = idx === 3;

                  return (
                    <div key={idx} className={`flex items-start gap-3 transition-opacity duration-500 ${isFuture ? 'opacity-0' : 'opacity-100'}`}>
                      <div className="mt-0.5 shrink-0">
                        {isPast ? (
                          <CheckCircle2 className="w-5 h-5 text-amber-500" />
                        ) : isCurrent ? (
                          isLast ? <Hourglass className="w-5 h-5 text-amber-400 animate-pulse" /> : <CircleDashed className="w-5 h-5 text-amber-400 animate-spin-slow" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-zinc-700" />
                        )}
                      </div>
                      <p className={`text-sm font-medium leading-snug ${isPast ? 'text-zinc-300' : isCurrent ? 'text-amber-400 animate-pulse' : 'text-zinc-600'}`}>
                        {phrase}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : !result ? (
            <div className="w-full">
              {image ? (
                <div className="mb-6 relative">
                  <img
                    src={image}
                    alt="Imagem capturada"
                    className="w-full h-80 object-cover rounded-2xl border-2 border-gray-700 shadow-2xl"
                  />
                </div>
              ) : (
                <div className="mb-6 h-80 bg-gradient-to-br from-gray-900 to-black rounded-2xl relative overflow-hidden">
                  <div className="absolute inset-0 p-8">
                    <div className="absolute top-8 left-8 w-16 h-16 border-l-4 border-t-4 border-orange-500"></div>
                    <div className="absolute top-8 right-8 w-16 h-16 border-r-4 border-t-4 border-orange-500"></div>
                    <div className="absolute bottom-8 left-8 w-16 h-16 border-l-4 border-b-4 border-orange-500"></div>
                    <div className="absolute bottom-8 right-8 w-16 h-16 border-r-4 border-b-4 border-orange-500"></div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-20 h-20 text-orange-500 mx-auto mb-4 animate-pulse" />
                      <p className="text-gray-400 text-lg">Posicione o alimento aqui</p>
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageCapture}
                className="hidden"
                id="camera-input"
              />

              <div className="space-y-4">
                {!image ? (
                  <div className="space-y-2">
                    <button
                      onClick={handleCaptureClick}
                      className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-5 px-6 rounded-2xl cursor-pointer transition-all duration-300 text-center shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 text-lg"
                    >
                      <Camera className="w-7 h-7 inline-block mr-3" />
                      Capturar Foto
                    </button>
                    
                    {!isSubscriber && (
                      <p className="text-center text-gray-500 text-sm font-bold mt-3 tracking-widest uppercase">
                        {scanCount >= LIMITE_USOS_FREE 
                          ? 'Limite de testes grátis atingido 🔒' 
                          : `Créditos Gratuitos: ${Math.max(LIMITE_USOS_FREE - scanCount, 0)}/${LIMITE_USOS_FREE}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleAnalyze}
                      disabled={isScanning}
                      className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 text-lg"
                    >
                      {isScanning ? (
                        'Analisando...'
                      ) : (
                        'Analisar Alimento'
                      )}
                    </button>

                    <button
                      onClick={handleReset}
                      className="w-full bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 text-gray-300 font-semibold py-4 px-6 rounded-2xl transition-all duration-300"
                    >
                      Capturar Outra Foto
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`w-full rounded-3xl p-8 backdrop-blur-xl bg-gradient-to-br from-gray-900/90 to-black/90 border-4 shadow-2xl ${
                result.verdict === 'ALLOWED'
                  ? 'border-green-500 shadow-green-500/20'
                  : result.verdict === 'WARNING'
                  ? 'border-yellow-500 shadow-yellow-500/20'
                  : 'border-red-500 shadow-red-500/20'
              }`}
            >
              <div className="text-center mb-8">
                {result.verdict === 'ALLOWED' ? (
                  <CheckCircle
                    className="w-32 h-32 mx-auto drop-shadow-2xl text-green-500 animate-pulse"
                    style={{ filter: 'drop-shadow(0 0 20px rgb(34 197 94 / 0.6))' }}
                  />
                ) : result.verdict === 'WARNING' ? (
                  <TriangleAlert
                    className="w-32 h-32 mx-auto drop-shadow-2xl text-yellow-500 animate-pulse"
                    style={{ filter: 'drop-shadow(0 0 20px rgb(234 179 8 / 0.6))' }}
                  />
                ) : (
                  <Skull
                    className="w-32 h-32 mx-auto drop-shadow-2xl text-red-500 animate-pulse"
                    style={{ filter: 'drop-shadow(0 0 20px rgb(239 68 68 / 0.6))' }}
                  />
                )}
              </div>

              <div className="text-center mb-6">
                <h2
                  className={`text-4xl md:text-6xl font-black mb-3 ${
                    result.verdict === 'ALLOWED' 
                      ? 'text-green-500' 
                      : result.verdict === 'WARNING'
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}
                  style={{
                    textShadow:
                      result.verdict === 'ALLOWED'
                        ? '0 0 30px rgb(34 197 94 / 0.5)'
                        : result.verdict === 'WARNING'
                        ? '0 0 30px rgb(234 179 8 / 0.5)'
                        : '0 0 30px rgb(239 68 68 / 0.5)',
                  }}
                >
                  {result.verdict === 'ALLOWED' ? 'APROVADO' : result.verdict === 'WARNING' ? 'ATENÇÃO' : 'REPROVADO'}
                </h2>
                <p className="text-2xl md:text-3xl font-bold text-white">
                  {result.title}
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
                <p className="text-white text-lg text-center leading-relaxed">
                  {result.explanation}
                </p>

                {/* 👇 O GATILHO VIP (BLUR) PARA A TROCA LIMPA */}
                {result.clean_swap && (result.verdict === 'BANNED' || result.verdict === 'WARNING') && (
                  <div className="mt-5 pt-5 border-t border-white/10">
                    <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                      🔄 Troca Limpa
                    </h4>
                    
                    {(!isSubscriber && scanCount >= 2) ? (
                      <div className="relative group cursor-pointer" onClick={() => setShowPaywall(true)}>
                        <p className="text-zinc-300 text-center font-medium blur-[6px] select-none opacity-50 px-2">
                          {result.clean_swap.length > 50 ? result.clean_swap : "Substitua por manteiga, banha de porco ou azeite extra virgem orgânico. Evite inflamação."}
                        </p>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                          <Lock className="w-8 h-8 text-amber-500 drop-shadow-lg" />
                          <span className="bg-zinc-900/90 text-amber-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/30">
                            Exclusivo VIP
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white font-medium text-center bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 shadow-inner">
                        {result.clean_swap}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {result.curiosity_fact && (
                <div className="flex justify-center mb-8">
                  <button
                    onClick={() => setShowCuriosityModal(true)}
                    className={`flex items-center gap-2 text-sm font-bold tracking-widest uppercase transition-all duration-300 active:scale-95 bg-transparent border-none outline-none ${
                      result.verdict === 'ALLOWED' 
                        ? 'text-green-400/70 hover:text-green-400' 
                        : result.verdict === 'WARNING'
                        ? 'text-yellow-400/70 hover:text-yellow-400'
                        : 'text-red-400/70 hover:text-red-400'
                    }`}
                  >
                    <span className="text-lg">
                      {result.verdict === 'ALLOWED' ? '🧬' : result.verdict === 'WARNING' ? '⚠️' : '👁️'}
                    </span>
                    {result.verdict === 'ALLOWED' ? 'Biologia Aplicada' : result.verdict === 'WARNING' ? 'Ajuste Prático' : 'Segredo da Indústria'}
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleReset}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-white font-bold py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg active:scale-95"
                >
                  <RotateCcw className="w-6 h-6 mr-3" />
                  Escanear Outro
                </button>

                {/* 👇 A PONTE PARA O CHEF IA (Somente Aprovados) */}
                {result.verdict === 'ALLOWED' && (
                  <button 
                    onClick={() => router.push(`/chef-ia?ingredientes=${encodeURIComponent(result.title)}`)}
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg active:scale-95 border border-orange-500/50"
                  >
                    <ChefHat className="w-6 h-6 mr-3 shrink-0" />
                    Gerar Receita com este Ingrediente
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        userId={user?.id || ''} 
      />

      {showCuriosityModal && result?.curiosity_fact && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-zinc-950/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`relative w-full max-w-md border-t-2 sm:border-2 rounded-t-[2rem] sm:rounded-[2rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 ${
            result.verdict === 'ALLOWED' 
              ? 'bg-zinc-900 border-green-500/50' 
              : result.verdict === 'WARNING'
              ? 'bg-zinc-900 border-yellow-500/50'
              : 'bg-zinc-900 border-red-500/50'
          }`}>
            
            <button
              onClick={() => setShowCuriosityModal(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">
                {result.verdict === 'ALLOWED' ? '🧬' : result.verdict === 'WARNING' ? '⚠' : '👁️'}
              </span>
              <h3 className={`text-xl font-black uppercase tracking-tight ${
                result.verdict === 'ALLOWED' 
                  ? 'text-green-400' 
                  : result.verdict === 'WARNING'
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}>
                {result.verdict === 'ALLOWED' ? 'Biologia Aplicada' : result.verdict === 'WARNING' ? 'Ponto de Atenção' : 'Arquivo Confidencial'}
              </h3>
            </div>

            <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800 shadow-inner">
              <p className="text-zinc-300 text-base leading-relaxed font-medium">
                "{result.curiosity_fact}"
              </p>
            </div>

            <button
              onClick={() => setShowCuriosityModal(false)}
              className="w-full mt-8 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95 uppercase tracking-wider text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}