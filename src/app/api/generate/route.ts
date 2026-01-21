import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('CORPO RECEBIDO:', body);
    const ingredients = body.ingredients || body.description || body.prompt || body.text || Object.values(body)[0];

    if (!ingredients) {
      return NextResponse.json(
        { error: 'Ingredientes são obrigatórios' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada' },
        { status: 500 }
      );
    }

    const prompt = `Crie uma receita deliciosa usando os seguintes ingredientes: ${ingredients}

Regras:
- Use APENAS os ingredientes mencionados
- Seja criativo e prático
- Inclua tempo de preparo
- Liste ingredientes com quantidades
- Descreva o modo de preparo passo a passo
- Adicione dicas úteis

REGRA DE DESPENSA BÁSICA: Assuma que o usuário SEMPRE possui em casa os seguintes itens básicos: Sal, Pimenta do Reino, Alho, Cebola, Água e Gorduras para cozinhar (Manteiga, Banha ou Azeite).

Nunca diga que a receita ficará sem sabor ou que faltam temperos se o usuário fornecer apenas uma proteína (ex: Carne). Use o "Kit Básico" para sugerir refogados, temperos e métodos de cocção saborosos.`;

    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const recipeText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!recipeText) {
      console.error('Resposta sem texto:', data);
      return NextResponse.json(
        { error: 'Falha ao processar receita', debug: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ recipe: recipeText });
  } catch (error: any) {
    console.error('Erro ao gerar receita:', error);
    return NextResponse.json(
      { 
        error: error.message,
        details: error.toString(),
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
