'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, Skull, Loader2, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';

interface ScanResult {
  verdict: 'ALLOWED' | 'BANNED';
  title: string;
  explanation: string;
}

export default function ScannerPage() {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ESTADOS DE CONTROLE DO PAYWALL E BANCO ---
  const [user, setUser] = useState<any>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  // 👇 Nova variável do Odômetro Total do Scanner
  const [totalScansCount, setTotalScansCount] = useState(0);

  // --- 1. CARREGAR DADOS REAIS DO SUPABASE ---
  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        
        // 👇 Puxa o perfil completo, incluindo o total_scans
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_subscriber, daily_scan_count, total_scans')
          .eq('id', authUser.id)
          .single();
          
        if (profile) {
          setIsSubscriber(profile.is_subscriber || false);
          setScanCount(profile.daily_scan_count || 0);
          setTotalScansCount(profile.total_scans || 0); // Guarda o total histórico
        }
      }
    };
    checkUserStatus();
  }, []);

  // --- 2. TRAVA DA CÂMERA ---
  const handleCaptureClick = () => {
    if (!isSubscriber && scanCount >= 3) {
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
      // Chamada para a API do Gemini
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

      // --- 3. ATUALIZA CONTADOR NO SUPABASE APÓS SUCESSO ---
      if (user) {
        const nextCount = scanCount + 1;
        const nextTotal = totalScansCount + 1; // Odômetro sobe 1

        setScanCount(nextCount); // Atualiza na tela
        setTotalScansCount(nextTotal); // Atualiza na tela
        
        // 👇 Salva NO BANCO os dois contadores de uma vez
        await supabase
          .from('profiles')
          .update({ 
            daily_scan_count: nextCount,
            total_scans: nextTotal
          })
          .eq('id', user.id);
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
        {/* Header Moderno */}
        <div className="text-center mb-8 pt-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-white bg-clip-text text-transparent mb-3">
            Scanner Visual
          </h1>
          <p className="text-gray-400 text-lg">
            Escaneie alimentos e descubra se são aprovados na dieta Animal-Based
          </p>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center">
          {!result ? (
            <div className="w-full">
              {/* Área da Câmera */}
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
                      <p className="text-center text-gray-500 text-sm font-medium mt-2">
                        {scanCount >= 3 
                          ? 'Limite de testes grátis atingido 🔒' 
                          : `Testes grátis restantes: ${Math.max(3 - scanCount, 0)}/3`}
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
                        <>
                          <Loader2 className="w-7 h-7 mr-3 animate-spin" />
                          Analisando...
                        </>
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
                  : 'border-red-500 shadow-red-500/20'
              }`}
            >
              <div className="text-center mb-8">
                {result.verdict === 'ALLOWED' ? (
                  <CheckCircle
                    className={`w-32 h-32 mx-auto drop-shadow-2xl text-green-500 animate-pulse`}
                    style={{ filter: 'drop-shadow(0 0 20px rgb(34 197 94 / 0.6))' }}
                  />
                ) : (
                  <Skull
                    className={`w-32 h-32 mx-auto drop-shadow-2xl text-red-500 animate-pulse`}
                    style={{ filter: 'drop-shadow(0 0 20px rgb(239 68 68 / 0.6))' }}
                  />
                )}
              </div>

              <div className="text-center mb-6">
                <h2
                  className={`text-4xl md:text-6xl font-black mb-3 ${
                    result.verdict === 'ALLOWED' ? 'text-green-500' : 'text-red-500'
                  }`}
                  style={{
                    textShadow:
                      result.verdict === 'ALLOWED'
                        ? '0 0 30px rgb(34 197 94 / 0.5)'
                        : '0 0 30px rgb(239 68 68 / 0.5)',
                  }}
                >
                  {result.verdict === 'ALLOWED' ? 'APROVADO' : 'REPROVADO'}
                </h2>
                <p className="text-2xl md:text-3xl font-bold text-white">
                  {result.title}
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10">
                <p className="text-white text-lg text-center leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              <button
                onClick={handleReset}
                className="w-full bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 text-white font-bold py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg"
              >
                <RotateCcw className="w-6 h-6 mr-3" />
                Escanear Outro
              </button>
            </div>
          )}
        </div>
      </div>

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        userId={user?.id || ''} 
      />
    </div>
  );
}