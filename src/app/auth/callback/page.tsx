'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Verifica se há um usuário autenticado
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro ao obter sessão:', error);
          router.push('/login?error=auth_failed');
          return;
        }

        if (session?.user) {
          // Verifica se o perfil já existe
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // Se não existe perfil, cria um básico
          if (!profile) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
                level: 1,
              });

            if (profileError) {
              console.error('Erro ao criar perfil:', profileError);
            }
          }

          // Redireciona para a página inicial
          router.push('/');
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Erro no callback:', err);
        router.push('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
        <p className="text-zinc-400">Autenticando...</p>
      </div>
    </div>
  );
}
