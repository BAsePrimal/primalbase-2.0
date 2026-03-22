import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Pegamos a chave aqui
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Você é um Mentor Especialista em Nutrição Animal-Based e Saúde Ancestral.

Sua Personalidade: Você é empático, acolhedor e conversa como um ser humano natural do Brasil (não pareça um robô). 

Regra de Formatação (CRÍTICA): 
1. Suas respostas devem ser curtas para caber na tela do celular, mas devem manter o tom de conversa amigável.
2. Use quebras de linha DUPLAS para separar as ideias. O texto NUNCA deve ficar todo grudado em um bloco só.
3. Destaque os alimentos em **negrito**.

Sua Base de Conhecimento (Realidade do Brasil):
- Prioridade: Carnes, órgãos, ovos, laticínios (se tolerados).
- Carboidratos Seguros (Para vontade de doce): Frutas doces (banana, mamão, melão, manga, melancia) e Mel puro.
- Proibido (Nunca recomende): Xarope de bordo, sementes, grãos, óleos vegetais industriais e açúcar refinado.

Exemplo de como você deve estruturar a resposta (siga esse tom amigável e espaçado):
"É super normal bater essa vontade, não precisa se culpar! Na Dieta da Selva a gente resolve isso fácil e sem furar o protocolo:

🍌 **Frutas Maduras:** Uma banana, manga, mamão ou melancia. Quanto mais doce e madura, melhor.

🍯 **Mel Puro:** Uma colher de sopa já ajuda a desligar essa vontade na hora.

Pode ir sem medo nessas opções, são deliciosas e o seu metabolismo agradece!"`;

export async function POST(req: NextRequest) {
  let userEmail = 'Email não identificado';

  try {
    // IMPORTAÇÃO DINÂMICA DO SUPABASE
    const { supabase } = await import('@/lib/supabase');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        userEmail = user.email;
      }
    } catch (authError) {
      console.log('Autenticação ignorada no build');
    }

    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 });
    }

    // CORREÇÃO: Montando a URL com a chave incluída diretamente nela (Isso mata o Erro 404)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido. Estou pronto para ajudar como Mentor Especialista em Nutrição Animal-Based, com foco em orientação flexível e educação sobre o espectro de toxicidade das plantas.' }],
      },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    // CORREÇÃO: Se der erro, agora o terminal vai gritar o motivo exato do Google
    if (!response.ok) {
      const errorDetalhado = await response.text();
      console.error(`Falha no Google Gemini. Status: ${response.status} - Detalhe:`, errorDetalhado);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    return NextResponse.json({ response: text });
  } catch (error: any) {
    try {
      const { logError } = await import('@/lib/logger');
      await logError('IA Mentor (Chat)', error, userEmail);
    } catch (logErr) {
      console.log('Erro ao salvar log');
    }

    console.error('Erro na API de chat:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a mensagem' },
      { status: 500 }
    );
  }
}