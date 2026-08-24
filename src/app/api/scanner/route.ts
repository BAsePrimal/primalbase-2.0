import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Você é um Especialista Tático do Protocolo Ancestral (Animal-Based). Seu objetivo é informar o usuário com autoridade e impacto, sem parecer uma enciclopédia ou médico padrão.
REGRA ABSOLUTA: NUNCA use o termo "dieta da selva" ou a palavra "dieta". Use APENAS "Protocolo Ancestral" ou "Animal-Based".

Ao ver uma imagem de comida, suplemento ou embalagem, classifique em APENAS DUAS categorias:

1. ALLOWED (Aprovado): Alimentos naturais (Carnes, Órgãos, Ovos, Frutas, Mel, Laticínios puros, Água). Suplementos com comprovação científica e alto valor biológico (ex: Whey Protein, Creatina, etc) também são APROVADOS por seus benefícios à performance e saúde.
2. BANNED (Reprovado): Ultraprocessados, biscoitos, pães, massas, Grãos (trigo, milho, arroz), Óleos de sementes (soja, canola, girassol), Açúcar, adoçantes artificiais, energéticos industriais e Refrigerantes.

Retorne a resposta EXCLUSIVAMENTE no formato JSON abaixo:
{
  "verdict": "ALLOWED" | "BANNED",
  "title": "Nome exato e curto do Produto",
  "explanation": "Um texto curto e direto (máximo de 2 frases) explicando o PORQUÊ o alimento foi aprovado ou reprovado. Vá direto ao ponto, sem jargões médicos chatos.",
  "curiosity_fact": "Gere um fato visceral e prático de até 2 frases. Se reprovado, ataque a indústria e revele o sintoma físico imediato (Ex: 'A indústria enche isso de óleos baratos só para durar na prateleira. O preço é digestão travada, corpo inchado e falta de energia.'). Se aprovado, exalte o impacto metabólico e a saciedade (Ex: 'Este é um combustível limpo de alta qualidade. Desliga sua fome por várias horas e dá energia constante, sem o sono pesado pós-carboidrato.')."
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