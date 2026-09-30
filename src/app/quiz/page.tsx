'use client'

import { useState } from 'react'
import { Flame, Target, Droplets, MessageSquare, Search, Utensils } from 'lucide-react'
import LegalFooter from '@/components/LegalFooter';

type QuizStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

interface QuizAnswers {
  nutricao?: string
  chef?: string
  scanner?: string
  agua?: string
  especialista?: string
  jornada?: string
}

export default function QuizPage() {
  const [step, setStep] = useState<QuizStep>(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [loadingText, setLoadingText] = useState('')
  const [progress, setProgress] = useState(0)

  const handleAnswer = (key: keyof QuizAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))

    if (step === 6) {
      startLoading()
    } else {
      setTimeout(() => {
        setStep((prev) => (prev + 1) as QuizStep)
      }, 350)
    }
  }

  const startLoading = () => {
    setStep(7)
    setProgress(0)

    const texts = [
      'Analisando padrões de rotina...',
      'Mapeando deficiências nutricionais...',
      'Processando ferramentas necessárias...',
      'Montando o seu plano de ação...',
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
      setStep(8)
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
      className="w-full min-h-[5rem] py-4 px-6 text-left text-base md:text-lg font-medium rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 text-zinc-200 transition-all duration-200 flex items-center shadow-sm leading-snug"
    >
      {children}
    </button>
  )

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] flex flex-col items-center pb-8 px-4">
            <style dangerouslySetInnerHTML={{__html: `
              @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@500;700;900&display=swap');
            `}} />
            
            <div className="flex justify-center items-center mb-2 relative w-24 h-24">
              <div className="absolute inset-0 bg-amber-500/20 blur-[25px] rounded-full"></div>
              <Flame className="w-16 h-16 text-amber-500 relative z-10" />
            </div>
            
            <h1 
              className="uppercase text-center text-white w-full max-w-2xl"
              style={{ 
                fontFamily: "'Bebas Neue', sans-serif", 
                fontSize: "clamp(2.5rem, 10vw, 4rem)", 
                lineHeight: "1.1",
                letterSpacing: "0.5px"
              }}
            >
              O QUE VOCÊ COME DEFINE<br className="hidden md:block" /> SE VOCÊ TEM <span className="text-amber-500">ENERGIA</span><br className="md:hidden" /> OU VIVE <span className="text-amber-500">CANSADO.</span>
            </h1>
            
            <p 
              className="text-center text-zinc-300 mx-auto text-lg md:text-xl"
              style={{ 
                fontFamily: "'Montserrat', sans-serif", 
                fontWeight: 700, 
                lineHeight: "1.5",
                maxWidth: "90%"
              }}
            >
              Responda a 5 perguntas rápidas e veja como ajustar a sua rotina com <span className="text-amber-500" style={{ fontWeight: 900 }}>comida de verdade</span>.
            </p>
            
            <div className="w-full max-w-md mt-10">
              <button
                onClick={() => setStep(1)}
                className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 py-5 rounded-2xl shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all duration-300 transform active:scale-[0.98] uppercase tracking-widest outline-none border-none"
                style={{ 
                  fontFamily: "'Montserrat', sans-serif", 
                  fontWeight: 900, 
                  fontSize: "1.25rem" 
                }}
              >
                COMEÇAR AGORA
              </button>
              
              <p className="text-zinc-500 text-sm mt-4 text-center font-medium flex items-center justify-center gap-1.5"
                 style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <span className="text-lg">⏱️</span> Leva menos de 30 segundos.
              </p>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <Utensils className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-center text-white tracking-tight px-4 leading-tight">
              Como organiza a sua alimentação durante a semana?
            </h2>
            <div className="flex flex-col gap-3 mt-10 px-4">
              <OptionButton onClick={() => handleAnswer('nutricao', 'A')}>Sigo dietas restritivas, mas acabo sempre por desistir.</OptionButton>
              <OptionButton onClick={() => handleAnswer('nutricao', 'B')}>Como o que tiver à frente, não tenho muito tempo.</OptionButton>
              <OptionButton onClick={() => handleAnswer('nutricao', 'C')}>Tento comer bem, mas falta-me organização diária.</OptionButton>
              <OptionButton onClick={() => handleAnswer('nutricao', 'D')}>Precisava de um cardápio limpo e prático que se adaptasse à minha rotina.</OptionButton>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <Flame className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-center text-white tracking-tight px-4 leading-tight">
              Chega a casa cansado e não sabe o que fazer para o jantar. Qual é o padrão?
            </h2>
            <div className="flex flex-col gap-3 mt-10 px-4">
              <OptionButton onClick={() => handleAnswer('chef', 'A')}>Acabo a pedir delivery e gasto dinheiro à toa.</OptionButton>
              <OptionButton onClick={() => handleAnswer('chef', 'B')}>Como qualquer alimento ultraprocessado que seja rápido.</OptionButton>
              <OptionButton onClick={() => handleAnswer('chef', 'C')}>Repito sempre a mesma refeição sem graça.</OptionButton>
              <OptionButton onClick={() => handleAnswer('chef', 'D')}>Queria que alguém me desse uma receita rápida só com o que sobrou na geladeira.</OptionButton>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <Search className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-center text-white tracking-tight px-4 leading-tight">
              Quando vai ao supermercado comprar produtos "saudáveis", como escolhe?
            </h2>
            <div className="flex flex-col gap-3 mt-10 px-4">
              <OptionButton onClick={() => handleAnswer('scanner', 'A')}>Confio no que está escrito na frente da embalagem (Zero, Fit, Light).</OptionButton>
              <OptionButton onClick={() => handleAnswer('scanner', 'B')}>Tento ler os ingredientes, mas não entendo os nomes difíceis.</OptionButton>
              <OptionButton onClick={() => handleAnswer('scanner', 'C')}>Sei que a indústria esconde açúcar, mas acabo por comprar na mesma.</OptionButton>
              <OptionButton onClick={() => handleAnswer('scanner', 'D')}>Precisava de um raio-x rápido para desmascarar o que é lixo e o que é comida real.</OptionButton>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <Droplets className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-center text-white tracking-tight px-4 leading-tight">
              Como é o seu consumo de água?
            </h2>
            <div className="flex flex-col gap-3 mt-10 px-4">
              <OptionButton onClick={() => handleAnswer('agua', 'A')}>Bebo muito pouco, acabo por me esquecer durante o trabalho.</OptionButton>
              <OptionButton onClick={() => handleAnswer('agua', 'B')}>Bebo só quando sinto muita sede.</OptionButton>
              <OptionButton onClick={() => handleAnswer('agua', 'C')}>Substituto muita água por café para tentar ter energia.</OptionButton>
              <OptionButton onClick={() => handleAnswer('agua', 'D')}>Queria um sistema simples que me lembrasse e calculasse o ideal para mim.</OptionButton>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <MessageSquare className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-center text-white tracking-tight px-4 leading-tight">
              Quando tem dúvidas sobre o que pode ou não comer na dieta, o que costuma fazer?
            </h2>
            <div className="flex flex-col gap-3 mt-10 px-4">
              <OptionButton onClick={() => handleAnswer('especialista', 'A')}>Fico perdido e acabo comendo errado.</OptionButton>
              <OptionButton onClick={() => handleAnswer('especialista', 'B')}>Pesquiso na internet, mas acho a informação muito confusa.</OptionButton>
              <OptionButton onClick={() => handleAnswer('especialista', 'C')}>Acabo quebrando a dieta por não ter quem me oriente.</OptionButton>
              <OptionButton onClick={() => handleAnswer('especialista', 'D')}>Queria poder tirar dúvidas na hora com um especialista.</OptionButton>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <Target className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-center text-white tracking-tight px-4 leading-tight">
              Qual é o seu maior obstáculo para manter a consistência e não voltar a engordar?
            </h2>
            <div className="flex flex-col gap-3 mt-10 px-4">
              <OptionButton onClick={() => handleAnswer('jornada', 'A')}>A falta de disciplina quando não vejo resultados rápidos.</OptionButton>
              <OptionButton onClick={() => handleAnswer('jornada', 'B')}>A ansiedade e os picos de stress no dia a dia.</OptionButton>
              <OptionButton onClick={() => handleAnswer('jornada', 'C')}>Ficar perdido sem saber se estou a fazer as coisas certas.</OptionButton>
              <OptionButton onClick={() => handleAnswer('jornada', 'D')}>Falta-me um mapa visual claro para acompanhar o meu progresso diário.</OptionButton>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-8 flex flex-col items-center justify-center animate-[fade-in_0.5s_ease-out_forwards]">
            <div className="relative mb-6">
               <div className="absolute inset-0 bg-amber-500/20 blur-[30px] rounded-full animate-pulse"></div>
               <Search className="w-20 h-20 text-amber-500 relative z-10 animate-pulse" />
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

      case 8:
        return (
          <div className="space-y-8 animate-[fade-in_0.5s_ease-out_forwards] w-full max-w-xl mx-auto px-4">
            <div className="flex justify-center mb-6">
              <Target className="w-16 h-16 text-amber-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-center text-amber-500 tracking-tight uppercase leading-none">
              ANÁLISE CONCLUÍDA
            </h1>
            
            <div className="bg-zinc-950/60 rounded-2xl p-6 md:p-8 mt-8 text-left relative overflow-hidden shadow-inner border border-zinc-800/50">
               <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              
              <p className="text-zinc-300 leading-relaxed text-base md:text-lg pl-2">
                O problema não é a sua disciplina. O motivo pelo qual vive cansado e não consegue manter a rotina é a falta das ferramentas certas para lidar com a pressa do dia a dia e com as armadilhas da indústria alimentar.
                <br /><br />
                <span className="text-white font-semibold">Nós resolvemos isso.</span>
                <br /><br />
                O PrimalBase tem as ferramentas práticas para organizar o seu cardápio, gerar as suas refeições, escanear os seus rótulos, tirar as suas dúvidas e mapear a sua evolução diária.
                <br /><br />
                Está na hora de ver como isto funciona na prática.
              </p>
            </div>

            <div className="w-full max-w-md mx-auto mt-10">
              <button 
                onClick={() => window.location.href = '/?visitante=true&tour=start'}
                className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-black text-base md:text-lg py-5 rounded-2xl shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all duration-300 transform active:scale-[0.98] uppercase tracking-widest outline-none border-none animate-bounce px-2"
              >
                INICIAR O MEU TOUR GUIADO (GRÁTIS)
              </button>
            </div>
          </div>
        )
      }
    }

  return (
    <div className="min-h-[100dvh] w-full bg-zinc-950 flex flex-col justify-center items-center py-8">
      <div className="w-full max-w-3xl flex flex-col justify-center">
        
      {step > 0 && step < 7 && (
          <div className="mb-10 w-full max-w-xl mx-auto px-6">
            <ProgressBar value={(step / 6) * 100} />
          </div>
        )}

        {renderStep()}
        
      </div>

      {(step === 0 || step === 8) && (
        <LegalFooter />
      )}

    </div>
  )
}