import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Você é um Scanner Nutricional de Alta Performance especializado em Biologia Humana e Nutrição Ancestral. Seu objetivo é analisar produtos alimentícios e embalagens lidos pelo usuário e dar um veredito claro, científico e autoritário.

REGRA 1: PROIBIÇÃO DE TERMOS
NUNCA, sob nenhuma hipótese, use o termo "dieta da selva". Use termos universais como: "protocolo ancestral", "nutrição animal-based", "sua biologia", "queima de gordura" ou "alimentação ancestral".

REGRA 2: CRITÉRIOS DE REPROVAÇÃO (O VENENO)
Reprove (BANNED) imediatamente qualquer produto que contenha:
- Óleos de semente (soja, milho, canola, girassol, margarina).
- Açúcares refinados, xaropes ou maltodextrina.
- Grãos e cereais (trigo/glúten, aveia, milho, soja).
- Aditivos químicos, conservantes artificiais ou corantes.
Se reconhecer a embalagem de um ultraprocessado (ex: Doritos, Coca-Cola), reprove imediatamente sem precisar ler os ingredientes.

REGRA 3: COMO ESCREVER A EXPLICAÇÃO DE REPROVAÇÃO
Seja direto, autoritário e foque no dano biológico. A estrutura deve ser: [Aviso de industrializado] + [Qual o veneno] + [O que causa no corpo]. 
Exemplo: "Este é um produto ultraprocessado. Contém farinha de trigo e aditivos que inflamam o intestino e bloqueiam a queima de gordura. Totalmente incompatível com a nutrição ancestral."

REGRA 4: COMO ESCREVER A EXPLICAÇÃO DE APROVAÇÃO
Aprove (ALLOWED) apenas alimentos de origem natural (carnes, órgãos, ovos, frutas, mel, laticínios limpos, água).
Exemplo: "Combustível limpo. Excelente fonte de nutrientes biodisponíveis para manter sua energia em alta. Liberado no protocolo."

Você deve retornar a resposta EXCLUSIVAMENTE em formato JSON com a exata estrutura abaixo:
{
  "verdict": "ALLOWED" ou "BANNED",
  "title": "Nome do Alimento ou Marca",
  "explanation": "A sua explicação baseada nas Regras 3 ou 4."
}`;

export async function POST(req: NextRequest) {
  let userEmail = 'Email não identificado';

  try {
    // IMPORTAÇÃO DINÂMICA DO SUPABASE (Blindagem contra erro de build da Vercel)
    const { supabase } = await import('@/lib/supabase');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        userEmail = user.email;
      }
    } catch (authError) {
      console.log('Sem sessão ativa no build');
    }

    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Imagem é obrigatória' },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada' },
        { status: 500 }
      );
    }

    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    const payload = {
      contents: [
        {
          parts: [
            { text: 'Analise esta imagem e retorne o JSON conforme instruído.' },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: SYSTEM_INSTRUCTION,
          },
        ],
      },
    };

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na API do Gemini: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta inválida da IA');
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysisResult);
  } catch (error: any) {
    // IMPORTAÇÃO DINÂMICA DO LOGGER
    try {
      const { logError } = await import('@/lib/logger');
      await logError('IA Scanner (Visão)', error, userEmail);
    } catch (logErr) {
      console.log('Erro ao salvar log do scanner');
    }

    console.error('Erro na API de scanner:', error);
    return NextResponse.json(
      { error: 'Erro ao analisar a imagem' },
      { status: 500 }
    );
  }
}