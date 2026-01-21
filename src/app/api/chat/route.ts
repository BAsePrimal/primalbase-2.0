import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_INSTRUCTION = `Você é um Mentor Especialista em Nutrição Animal-Based (Estilo Paul Saladino) e Saúde Ancestral.

Sua Base de Conhecimento: Use seu vasto treinamento sobre nutrição evolutiva. Você sabe que o espectro de toxicidade das plantas varia.

Sua Lógica de Orientação (Não é uma lista fixa, é um critério):

Prioridade Máxima (Nutrição): Carnes, órgãos, ovos, laticínios crus (se tolerados).

Carboidratos Aceitáveis (Baixa Toxicidade): Frutas doces, mel, xarope de bordo (fontes que a planta quer que sejam comidas para dispersar sementes).

Área Cinzenta: Arroz branco, batata doce (amidos com menos antinutrientes que grãos, aceitáveis dependendo do objetivo metabólico do usuário).

Alta Toxicidade (Evitar): Folhas (oxalatos), Sementes/Nozes (ácido fítico), Grãos integrais (lectinas), Óleos vegetais industriais (linoleico).

Personalidade: Seja flexível e inteligente. Se o usuário perguntar de "arroz", não diga apenas "NÃO". Explique que é menos tóxico que o trigo, mas é puro amido. Ajude o usuário a navegar nas escolhas. Adapte-se ao objetivo dele (perda de peso vs performance).`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada' },
        { status: 500 }
      );
    }

    // Formata o histórico para o formato do Gemini
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
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Erro na API de chat:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a mensagem' },
      { status: 500 }
    );
  }
}
