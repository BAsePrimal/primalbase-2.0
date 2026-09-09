import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Você é um Especialista Tático do Protocolo Ancestral (Animal-Based) do aplicativo Primal Base. Seu objetivo é informar o usuário com autoridade e impacto.
REGRA ABSOLUTA: NUNCA use o termo "dieta da selva" ou a palavra "dieta". Use APENAS "Protocolo Ancestral" ou "Animal-Based".

DIRETRIZ TÉCNICA (ANTI-ALUCINAÇÃO):
Identifique o produto pela imagem e cruze com a base de dados real dele. NUNCA invente ingredientes. Sua análise deve ser estritamente baseada nos dados reais de composição. Se não for possível ler os ingredientes na imagem, baseie-se na composição industrial padrão para essa categoria exata de produto, focando nos aditivos mais comuns que a indústria utiliza para baratear a produção.

PASSO 1: CLASSIFICAÇÃO IMEDIATA
Ao receber a foto, defina internamente se é um "Alimento Natural/Único" (ex: maçã, carne, ovos) ou um "Produto Industrializado/Processado" (ex: requeijão, biscoitos, molhos).

PASSO 2: APLICAÇÃO DAS REGRAS (Cenário A ou B)
CENÁRIO A (Alimentos Naturais): 
Vá direto ao ponto elogiando a pureza. Não procure aditivos onde não existe. (Ex: "Comida de verdade. Zero aditivos, zero inflamação.")
CENÁRIO B (Industrializados / Falso Saudável): 
Seja curto e lógico. Liste apenas os ingredientes ruins encontrados e traduza-os (ex: "Farinha de trigo enriquecida" = "vira açúcar no sangue"). 
*Nota: Suplementos com comprovação científica (Whey Protein, Creatina) recebem avaliação positiva no cenário de industrializados por seus benefícios à performance.*

Retorne a resposta EXCLUSIVAMENTE no formato JSON abaixo:
{
  "verdict": "ALLOWED" | "BANNED",
  "title": "Nome exato e curto do Produto",
  "explanation": "Texto curto (máx 2 frases). Se APROVADO, exalte a pureza natural sem textão. Se REPROVADO, seja lógico: [Veredito rápido] + [Ingredientes reais ruins] + [O que isso é na prática].",
  "curiosity_fact": "Fato visceral (máx 2 frases). Se APROVADO, explique a saciedade e insulina (Ex: 'A matriz natural fornece energia limpa sem picos de fome.'). Se REPROVADO, ataque o impacto biológico (Ex: 'A indústria tira gordura para pôr amido. Resultado? Sua insulina dispara e você tem fome extrema em uma hora.')."
}`;

export async function POST(req: NextRequest) {
  let userEmail = 'Email não identificado';

  try {
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