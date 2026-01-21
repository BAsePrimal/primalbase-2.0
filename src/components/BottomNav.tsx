'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, ScanBarcode, BookOpen, Map } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  // Verifica se o link está ativo
  const isActive = (path: string) => pathname === path;

  // Estilo base: Cinza (inativo) -> Amber/Laranja (ativo)
  const getItemClass = (path: string) => 
    `flex flex-col items-center gap-1 transition-colors ${isActive(path) ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 pb-safe z-50">
      <div className="flex justify-around items-center max-w-md mx-auto h-16 px-2">
        
        <Link href="/" className={getItemClass('/')}>
          <Home size={22} />
          <span className="text-[10px] font-medium">Início</span>
        </Link>

        <Link href="/nutricao" className={getItemClass('/nutricao')}>
          <Utensils size={22} />
          <span className="text-[10px] font-medium">Nutrição</span>
        </Link>

        <Link href="/scanner" className={getItemClass('/scanner')}>
          <ScanBarcode size={22} />
          <span className="text-[10px] font-medium">Scanner</span>
        </Link>

        <Link href="/guide" className={getItemClass('/guide')}>
          <BookOpen size={22} />
          <span className="text-[10px] font-medium">Guia</span>
        </Link>

        <Link href="/jornada" className={getItemClass('/jornada')}>
          <Map size={22} />
          <span className="text-[10px] font-medium">Jornada</span>
        </Link>

      </div>
    </div>
  );
}
