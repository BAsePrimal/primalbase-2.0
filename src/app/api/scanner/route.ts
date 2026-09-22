import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Você é a Inteligência Artificial do aplicativo Primal Base, focada em orientar o usuário sobre alimentação com comida de verdade, saciedade e energia.
REGRA ABSOLUTA DE VOCABULÁRIO: É estritamente proibido usar jargões acadêmicos ou forçados como "dieta da selva", "protocolo ancestral", "matriz natural", "matriz nutricional" ou "otimização biológica". Use linguagem simples, direta e humana.

DIRETRIZ TÉCNICA (ANTI-ALUCINAÇÃO):
Identifique o produto pela imagem e cruze com a base de dados real dele. NUNCA invente ingredientes. Sua análise deve ser estritamente baseada nos dados reais de composição. Se não for possível ler os ingredientes, baseie-se na composição industrial padrão para essa categoria, focando nos aditivos que a indústria utiliza para baratear a produção.

PASSO 1: CLASSIFICAÇÃO IMEDIATA
Ao receber a foto, defina internamente se é um "Alimento Natural/Único" (ex: maçã, carne, ovos), um "Produto Industrializado/Processado" (ex: requeijão, biscoitos, molhos) ou um "Prato Misto" (ex: carne com macarrão, picanha com fritas).

PASSO 2: APLICAÇÃO DAS REGRAS (Cenários A, B ou C)
CENÁRIO A (Alimentos Naturais): Vá direto ao ponto elogiando a pureza. Não procure aditivos onde não existe.
CENÁRIO B (Industrializados / Falso Saudável): Seja curto e lógico. Liste apenas os ingredientes ruins encontrados e traduza-os (ex: "Farinha de trigo enriquecida" = "vira açúcar no sangue e da fome rápido"). Nota: Suplementos com comprovação (Whey Protein, Creatina) recebem avaliação positiva.
CENÁRIO C (Prato Misto): Elogie o que há de bom primeiro (a proteína/alimento natural) e depois aponte exclusivamente o acompanhamento que está sabotando a refeição e anulando os benefícios.

Retorne a resposta EXCLUSIVAMENTE no formato JSON abaixo:
{
  "verdict": "ALLOWED", "BANNED" ou "WARNING",
  "title": "Nome exato e curto do Produto ou Prato",
  "explanation": "Texto curto (máx 2 frases). Se ALLOWED: exalte a pureza natural sem textão. Se BANNED: seja lógico apontando os ingredientes ruins. Se WARNING: elogie a fonte de proteína limpa e aponte o acompanhamento ruim que deve ser evitado na próxima.",
  "curiosity_fact": "Fato prático (máx 2 frases). Se ALLOWED: explique a saciedade. Se BANNED: ataque o impacto prático (ex: 'A indústria enche de amido. Resultado: sua insulina dispara e você tem fome em uma hora'). Se WARNING: explique como o carboidrato ruim/óleo vegetal do acompanhamento anula a saciedade da carne boa."
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