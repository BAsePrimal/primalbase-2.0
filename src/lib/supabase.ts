import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente do Supabase com prefixo NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Criar cliente Supabase apenas se as variáveis estiverem configuradas
// Durante o build, isso permite que o projeto compile sem erros
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any; // Fallback para evitar erros de tipo
