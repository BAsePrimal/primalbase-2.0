import React from 'react';
import Link from 'next/link';

export default function LegalFooter() {
  return (
    <footer className="w-full mt-8 pb-8 text-center text-[10px] text-zinc-600 leading-tight">
      <div className="max-w-xl mx-auto px-4 flex flex-col gap-1.5">
        <p>
          © 2026 Primal Base | CNPJ: 52.236.710/0001-19
        </p>
        <p>
          Rua Inspetor Jaime Caldeira, 101 - Betim, MG | suporte@primalbase.com.br
        </p>
        <div className="flex justify-center gap-3 mt-2 font-medium">
          <Link href="/politica-privacidade" className="hover:text-zinc-400 transition-colors">
            Políticas de Privacidade
          </Link>
          <span>|</span>
          <Link href="/politica-termos-uso" className="hover:text-zinc-400 transition-colors">
            Termos de Uso
          </Link>
        </div>
      </div>
    </footer>
  );
}