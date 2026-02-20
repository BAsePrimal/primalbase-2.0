'use client'

import { useEffect, useState } from 'react'
import { Flame, Activity, Target, Zap } from 'lucide-react'

type QuizStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

interface QuizAnswers {
  biology?: string
  energy?: string
  weight?: string
  fasting?: string
  goal?: string
}

export default function QuizPage() {
  const [step, setStep] = useState<QuizStep>(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [loadingText, setLoadingText] = useState('')
  const [progress, setProgress] = useState(0)

  // Omitindo a forçagem de dark mode genérico, usaremos Tailwind absoluto
  // useEffect(() => {
  //   document.documentElement.classList.add('dark')
  // }, [])

  const handleAnswer = (key: keyof QuizAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))

    if (step === 5) {
      startLoading()
    } else {
      setTimeout(() => {
        setStep((prev) => (prev + 1) as QuizStep)
      }, 350)
    }
  }

  const startLoading = () => {
    setStep(6)
    setProgress(0)

    const texts = [
      'Analisando biologia...',
      'Calculando resistência à insulina...',
      'Mapeando níveis inflamatórios...',
      'Montando Protocolo Ancestral...',
    ]

    let textIndex = 0
    setLoadingText(texts[0])

    const textInterval = setInterval(() => {
      textIndex++
      if (textIndex < texts.length) {
        setLoadingText(texts[textIndex])
      }
    }, 1300)

    let currentProgress = 0
    const progressInterval = setInterval(() => {
      currentProgress += 2
      setProgress(currentProgress)
      if (currentProgress >= 100) {
        clearInterval(progressInterval)
      }
    }, 80)

    setTimeout(() => {
      clearInterval(textInterval)
      clearInterval(progressInterval)
      setProgress(100)
      setStep(7)
    }, 4000)
  }

  const ProgressBar = ({ value }: { value: number }) => (
    <div className="w-full">
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(251,191,36,0.6)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )

  const OptionButton = ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      // Padrão de botão de opção alinhado com o seu Modal
      className="w-full h-20 px-6 text-left text-lg md:text-xl font-medium rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 text-zinc-200 transition-all duration-200 flex items-center shadow-sm"
    >
      {children}
    </button>
  )

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] flex flex-col items-center">
            <div className="flex justify-center items-center mb-4 relative w-24 h-24">
              <div className="absolute inset-0 bg-amber-500/20 blur-[25px] rounded-full"></div>
              <Flame className="w-16 h-16 text-amber-500 relative z-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-center text-white leading-tight tracking-tight px-4">
              O Seu Corpo Esqueceu Como Queimar Gordura.
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 text-center max-w-2xl px-4 font-normal leading-relaxed">
              A vida moderna travou o seu metabolismo. Descubra como reativar a <strong className="text-amber-500 font-semibold">Cirurgia da Natureza</strong>.
            </p>
            
            <div className="w-full max-w-md mt-12 px-4">
              <button
                onClick={() => setStep(1)}
                // IDÊNTICO ao botão do seu Modal de "Iniciar Protocolo"
                className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-black text-xl py-5 rounded-2xl shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all duration-300 transform active:scale-[0.98] uppercase tracking-widest outline-none border-none"
              >
                INICIAR MAPEAMENTO
              </button>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <Activity className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-center text-white tracking-tight px-4">
              Qual é a sua biologia base?
            </h2>
            <div className="flex flex-col gap-4 mt-12 px-4">
              <OptionButton onClick={() => handleAnswer('biology', 'masculine')}>
                <span className="text-2xl mr-4">🦁</span> Masculina
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('biology', 'feminine')}>
                <span className="text-2xl mr-4">🐆</span> Feminina
              </OptionButton>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <Zap className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-center text-white tracking-tight px-4">
              Como estão os seus níveis de energia ao longo do dia?
            </h2>
            <div className="flex flex-col gap-3 mt-10 px-4">
              <OptionButton onClick={() => handleAnswer('energy', 'afternoon-crash')}>
                Sinto quedas bruscas à tarde
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('energy', 'wake-tired')}>
                Acordo cansado sempre
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('energy', 'coffee-dependent')}>
                Dependo de café o tempo todo
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('energy', 'constant')}>
                Energia constante
              </OptionButton>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <Target className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-center text-white tracking-tight px-4">
              Quando você ganha peso, onde a gordura se concentra mais?
            </h2>
            <div className="flex flex-col gap-3 mt-10 px-4">
              <OptionButton onClick={() => handleAnswer('weight', 'belly')}>
                <span>Na barriga <span className="text-zinc-500 text-sm ml-2 font-normal">(Resistência à insulina)</span></span>
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('weight', 'hips-thighs')}>
                Nos quadris / Coxas
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('weight', 'face-neck')}>
                <span>No rosto e pescoço <span className="text-zinc-500 text-sm ml-2 font-normal">(Inchaço)</span></span>
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('weight', 'overall')}>
                No corpo todo
              </OptionButton>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <Activity className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-center text-white tracking-tight px-4">
              Como você reage com mais de 4 horas sem comer?
            </h2>
            <div className="flex flex-col gap-3 mt-10 px-4">
              <OptionButton onClick={() => handleAnswer('fasting', 'stomach-pain')}>
                Estômago dói e fico irritado
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('fasting', 'weakness')}>
                Sinto fraqueza e tremores
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('fasting', 'sugar-craving')}>
                Vontade absurda de doces
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('fasting', 'calm')}>
                Fico tranquilo, uso minha gordura
              </OptionButton>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <Target className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-center text-white tracking-tight px-4">
              Qual é o seu principal objetivo?
            </h2>
            <div className="flex flex-col gap-3 mt-10 px-4">
              <OptionButton onClick={() => handleAnswer('goal', 'fat-loss')}>
                <span className="mr-3">🔥</span> Derreter gordura teimosa
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('goal', 'mental-clarity')}>
                <span className="mr-3">🧠</span> Clareza mental e foco
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('goal', 'reduce-inflammation')}>
                <span className="mr-3">⚡</span> Desinflamar e zerar inchaço
              </OptionButton>
              <OptionButton onClick={() => handleAnswer('goal', 'longevity')}>
                <span className="mr-3">🧬</span> Longevidade e Autofagia
              </OptionButton>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-8 flex flex-col items-center justify-center animate-[fade-in_0.5s_ease-out_forwards]">
            <div className="relative mb-6">
               <div className="absolute inset-0 bg-amber-500/20 blur-[30px] rounded-full animate-pulse"></div>
               <Flame className="w-20 h-20 text-amber-500 relative z-10" />
            </div>
            <h2 className="text-2xl font-black text-white text-center tracking-tight">Processando</h2>
            <div className="w-full max-w-sm px-6 mt-4">
              <ProgressBar value={progress} />
            </div>
            <p className="text-lg text-amber-500 font-medium text-center animate-pulse mt-4">
              {loadingText}
            </p>
          </div>
        )

        case 7:
            // Lógica de Inteligência Emocional (Efeito Barnum)
            const isFeminine = answers.biology === 'feminine';
            
            let goalText = "derreter a gordura teimosa e forçar seu corpo a usar o próprio estoque como combustível de alta performance."; // Padrão
            if (answers.goal === 'mental-clarity') {
              goalText = "eliminar a névoa cerebral, resetar seus receptores biológicos e te entregar um foco absoluto.";
            } else if (answers.goal === 'reduce-inflammation') {
              goalText = "zerar o inchaço constante, desligar a inflamação silenciosa e restaurar o seu sistema digestivo.";
            } else if (answers.goal === 'longevity') {
              goalText = "ativar a autofagia celular (a faxina do corpo), renovar seus tecidos e blindar a sua imunidade.";
            }
    
            return (
              <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto px-4">
                <div className="flex justify-center mb-6">
                  <Flame className="w-16 h-16 text-amber-500" />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-center text-amber-500 tracking-tight uppercase leading-none">
                  PROTOCOLO ENCONTRADO
                </h1>
                
                {/* Box idêntico ao "Card de Informação" do seu app */}
                <div className="bg-zinc-950/60 rounded-2xl p-6 md:p-8 mt-8 text-left relative overflow-hidden shadow-inner border border-zinc-800/50">
                   <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                  
                  <p className="text-zinc-300 leading-relaxed text-base md:text-lg pl-2">
                    Seu perfil biológico indica que o seu metabolismo está funcionando à base de açúcar e inflamação constante. Suas quedas de energia são o principal alerta.
                    <br /><br />
                    <span className="text-white font-semibold">A boa notícia?</span> Sua biologia {isFeminine ? "feminina" : "masculina"} pode ser resetada.
                    <br /><br />
                    Nós preparamos um <strong className="text-amber-500 font-medium">Desafio de 21 Dias</strong> que vai {goalText}
                  </p>
                </div>
    
                <div className="w-full max-w-md mx-auto mt-10">
              <button 
                onClick={() => window.location.href = 'https://www.primalbase.com.br/login'}
                className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-black text-xl py-5 rounded-2xl shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all duration-300 transform active:scale-[0.98] uppercase tracking-widest outline-none border-none animate-bounce"
              >
                ACESSAR MEU PROTOCOLO (GRÁTIS)
              </button>
            </div>
              </div>
            )
        }
      }

  return (
    // Fundo fixado no zinc-950 puro, alinhado ao centro.
    <div className="min-h-[100dvh] w-full bg-zinc-950 flex flex-col justify-center items-center py-8">
      <div className="w-full max-w-3xl flex flex-col justify-center">
        
        {step > 0 && step < 6 && (
          <div className="mb-10 w-full max-w-xl mx-auto px-6">
            <ProgressBar value={(step / 5) * 100} />
          </div>
        )}

        {renderStep()}
        
      </div>
    </div>
  )
}