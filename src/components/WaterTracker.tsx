'use client';

import { Droplet, Droplets, Waves } from 'lucide-react';

interface WaterTrackerProps {
  currentValue: number;
  goal: number;
  onAdd: (amount: number) => void;
}

export default function WaterTracker({ currentValue, goal, onAdd }: WaterTrackerProps) {
  const percentage = Math.min((currentValue / goal) * 100, 100);
  const isGoalReached = currentValue >= goal;

  return (
    <div className="w-full">
      {/* HEADER COMPACTO: Número SEMPRE AZUL FORTE */}
      <div className="flex justify-between items-center mb-3">
        <div>
          {/* Estilo iPhone: tracking-tighter e fonte refinada */}
          <span className={`text-4xl font-bold tracking-tighter transition-colors duration-500 ${isGoalReached ? 'text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-blue-400'}`}>
            {currentValue}
          </span>
          <span className={`font-medium ml-1 text-sm tracking-tight transition-colors ${isGoalReached ? 'text-blue-400/80' : 'text-zinc-500'}`}>
            / {goal} ml
          </span>
        </div>
        {/* Ícone à direita SEMPRE Azul e coerente com água */}
        {isGoalReached ? <Droplet className="w-6 h-6 text-blue-500 fill-blue-500" /> : <Droplets className="w-6 h-6 text-blue-500" />}
      </div>

      {/* BARRA DE PROGRESSO COMPACTA */}
      <div className="mb-4">
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${isGoalReached ? 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.6)]' : 'bg-blue-600'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* RECOMPENSA ELEGANTE ESTILO iPHONE */}
        {isGoalReached && (
          <div className="flex justify-center mt-3">
            <span className="text-xs font-semibold tracking-wide text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.4)] animate-pulse">
              Meta Diária Concluída
            </span>
          </div>
        )}
      </div>

      {/* BOTÕES DE ÁGUA MAIS BAIXOS E COMPACTOS */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => onAdd(250)} className="flex flex-col items-center justify-center py-3 bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 rounded-lg transition-colors active:scale-95 group">
          <Droplet className="w-4 h-4 text-blue-500 group-hover:text-blue-400 mb-1 transition-colors" />
          <span className="text-[10px] font-medium text-zinc-400 tracking-tight">+250ml</span>
        </button>
        <button onClick={() => onAdd(500)} className="flex flex-col items-center justify-center py-3 bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 rounded-lg transition-colors active:scale-95 group">
          <Droplets className="w-4 h-4 text-blue-500 group-hover:text-blue-400 mb-1 transition-colors" />
          <span className="text-[10px] font-medium text-zinc-400 tracking-tight">+500ml</span>
        </button>
        <button onClick={() => onAdd(1000)} className="flex flex-col items-center justify-center py-3 bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 rounded-lg transition-colors active:scale-95 group">
          <Waves className="w-4 h-4 text-blue-500 group-hover:text-blue-400 mb-1 transition-colors" />
          <span className="text-[10px] font-medium text-zinc-400 tracking-tight">+1L</span>
        </button>
      </div>
    </div>
  );
}