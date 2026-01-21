import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Você é um Fiscal de Nutrição Animal-Based (Dieta da Selva) extremamente rigoroso. Ao ver uma imagem de comida ou embalagem, classifique em APENAS DUAS categorias:

1. ALLOWED (Aprovado): Carnes, Órgãos, Ovos, Frutas, Mel, Laticínios puros, Água.

2. BANNED (Reprovado): Qualquer produto industrializado (biscoitos, pães, massas), Grãos (trigo, milho, arroz), Óleos de sementes (soja, canola), Açúcar, Refrigerantes.

Se reconhecer a marca/embalagem de um ultraprocessado (ex: Doritos, Coca-Cola), reprove imediatamente sem precisar ler ingredientes.

Retorne a resposta EXCLUSIVAMENTE em JSON:
{
  "verdict": "ALLOWED" | "BANNED",
  "title": "Nome do Alimento",
  "explanation": "Explicação curta e direta de 1 frase."
}`;

export async function POST(req: NextRequest) {
  try {
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

    // Remove o prefixo data:image/...;base64, se existir
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    // Prepara o payload para o Gemini 2.5 Flash
    const payload = {
      contents: [
        {
          parts: [
            {
              text: 'Analise esta imagem e retorne o JSON conforme instruído.',
            },
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

    // Chama a API do Gemini 2.5 Flash diretamente
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

    // Extrai o JSON da resposta (remove markdown se houver)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta inválida da IA');
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Erro na API de scanner:', error);
    return NextResponse.json(
      { error: 'Erro ao analisar a imagem' },
      { status: 500 }
    );
  }
}
