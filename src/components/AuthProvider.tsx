'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 🔥 LISTA VIP: Rotas que qualquer civil pode acessar sem precisar de login
  const publicRoutes = ['/login', '/auth/forgot-password', '/quiz'];

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Se NÃO tem crachá (sessão) e a página atual NÃO ESTÁ na Lista VIP, manda pro login
        if (!session && !publicRoutes.includes(pathname)) {
          router.replace('/login');
        } 
        // Se o cara já tem crachá e tenta ir pro login, manda pro QG (Home)
        else if (session && pathname === '/login') {
          router.replace('/');
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // 🔥 O mesmo vale para mudanças em tempo real no crachá
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!session && !publicRoutes.includes(pathname)) {
        router.replace('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return <>{children}</>;
}