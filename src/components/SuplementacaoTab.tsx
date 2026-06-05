'use client';

import { useState } from 'react';
import { ChevronRight, Zap, Heart, Droplets, Egg, Flame, Bone, Hexagon, Coffee, ShieldCheck, Leaf, Sparkles } from 'lucide-react';

const arsenal = [
  {
    nome: "Creatina",
    icon: Zap,
    tag: "Força & Volume",
    desc: "O suplemento mais testado do mundo. Entrega energia pura direto para as células, aumentando a força física e a resistência mental no treino."
  },
  {
    nome: "Ômega 3",
    icon: Heart,
    tag: "Coração & Cérebro",
    desc: "Uma gordura essencial para a saúde cardiovascular e otimização hormonal, blindando o corpo contra inflamações crônicas."
  },
  {
    nome: "Sal Orgânico",
    icon: Droplets,
    tag: "Hidratação Celular",
    desc: "O motor da sua hidratação. Rico em minerais essenciais que garantem a contração muscular e evitam dores de cabeça e fadiga."
  },
  {
    nome: "Ovos Caipira",
    icon: Egg,
    tag: "Fundação Nutricional",
    desc: "O multivitamínico da natureza. Possuem um perfil de gorduras e micronutrientes infinitamente superior aos de granja."
  },
  {
    nome: "Óleo de Coco",
    icon: Flame,
    tag: "Energia Rápida",
    desc: "Energia de ignição imediata. Rico em gorduras especiais que o corpo absorve na hora, perfeito para um pico de foco e treino."
  },
  {
    nome: "Caldo de Ossos",
    icon: Bone,
    tag: "Articulações & Intestino",
    desc: "Ouro líquido milenar. Carregado de colágeno e aminoácidos que restauram a parede intestinal e blindam as articulações."
  },
  {
    nome: "Mel Orgânico",
    icon: Hexagon,
    tag: "Pré-Treino Natural",
    desc: "Energia limpa e imediata. Um carboidrato natural com enzimas e antioxidantes que alimentam as bactérias boas da sua flora."
  },
  {
    nome: "Nibs de Cacau",
    icon: Coffee,
    tag: "Foco & Antioxidante",
    desc: "A matéria-prima real do chocolate. Ajuda a controlar o açúcar no sangue e sacia a vontade de doces sem picos de insulina."
  },
  {
    nome: "Kombucha",
    icon: ShieldCheck,
    tag: "Imunidade",
    desc: "O protetor vivo. Uma bebida que coloca um exército de bactérias boas no intestino, acabando com o estufamento pós-refeição."
  },
  {
    nome: "Moringa",
    icon: Leaf,
    tag: "Detox Celular",
    desc: "O faxineiro celular. Funciona como um detergente natural que limpa toxinas e a oxidação acumulada nos seus órgãos cruciais."
  },
  {
    nome: "Vermífugo Natural",
    icon: Sparkles,
    tag: "Limpeza Profunda",
    desc: "A limpeza metabólica. Parasitas roubam nutrientes. Um protocolo de ervas limpa o trato, devolvendo sua capacidade de absorção."
  }
];

export default function SuplementacaoTab() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleAccordion = (nome: string) => {
    setOpenItem(openItem === nome ? null : nome);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-2 pb-12 font-sans animate-in fade-in duration-500">
      
      {/* NOVO TÍTULO: Direto, Moderno, de Alto Impacto e Amigável */}
      <div className="mb-6 px-1">
        <h2 className="text-2xl font-black text-zinc-100 tracking-tight uppercase mb-1">
          Arsenal <span className="text-amber-500">Natural</span>
        </h2>
        <p className="text-zinc-500 text-[14px] font-medium">
          Apoio biológico eficiente. Eleve sua energia e blinde sua saúde com opções 100% naturais.
        </p>
      </div>

      {/* LISTA DE CARDS - Estrutura Blindada */}
      <div className="space-y-3">
        {arsenal.map((item) => {
          const isOpen = openItem === item.nome;
          
          return (
            <div 
              key={item.nome} 
              className={`group bg-zinc-900 border transition-all duration-300 rounded-2xl overflow-hidden ${
                isOpen 
                  ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' 
                  : 'border-zinc-800 hover:border-amber-500/30'
              }`}
            >
              
              {/* BOTÃO DO CARD */}
              <button 
                onClick={() => toggleAccordion(item.nome)}
                className="w-full flex items-center p-4 focus:outline-none"
              >
                {/* ÍCONE SEM BORDA - Apenas fundo sutil */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                  isOpen 
                    ? 'bg-amber-500/15 text-amber-500' 
                    : 'bg-zinc-950 text-zinc-400 group-hover:text-amber-400 group-hover:bg-amber-500/5'
                }`}>
                  <item.icon size={22} strokeWidth={2} />
                </div>
                
                {/* TEXTOS */}
                <div className="ml-4 flex-1 text-left">
                  <h3 className={`text-[17px] font-bold tracking-tight transition-colors duration-300 ${
                    isOpen ? 'text-amber-500' : 'text-zinc-100 group-hover:text-zinc-50'
                  }`}>
                    {item.nome}
                  </h3>
                  <span className="text-[13px] text-zinc-500 font-medium block mt-0.5">
                    {item.tag}
                  </span>
                </div>

                {/* BOTÃO DE SETA REDONDO */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isOpen 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-zinc-950 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-amber-500'
                }`}>
                  <ChevronRight 
                    size={18} 
                    strokeWidth={3}
                    className="transition-transform duration-300"
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  />
                </div>
              </button>

              {/* DESCRIÇÃO EXPANSÍVEL - Bloco Independente */}
              <div 
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ 
                  maxHeight: isOpen ? '200px' : '0px', 
                  opacity: isOpen ? 1 : 0 
                }}
              >
                {/* Caixa centralizada */}
                <div className="px-4 pb-4 pt-0">
                  <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/60 shadow-inner">
                    <p className="text-[14px] text-zinc-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}