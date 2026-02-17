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

    // --- O NOVO CÉREBRO: DIRETO, PRÁTICO E RESTRITO ---
    const prompt = `Você é um especialista em dieta Animal-Based focado em praticidade. 
Sua missão é criar uma refeição rápida e realista usando EXATAMENTE os ingredientes fornecidos pelo usuário: ${ingredients}

REGRAS ESTritas (LEIA COM ATENÇÃO):
1. PROIBIDO INVENTAR INGREDIENTES: VOCÊ NÃO PODE adicionar mel, canela, alho, cebola, temperos, ervas ou qualquer outro ingrediente que o usuário não tenha digitado. A ÚNICA exceção permitida é "Sal de cozinha comum" e uma "Gordura básica (Manteiga ou Banha)" apenas para untar ou fritar.
2. PRATICIDADE EXTREMA: Nada de suflês, bater claras em neve, usar ramequins ou forno se não for necessário. Foque em receitas de 1 frigideira. O usuário quer praticidade.
3. COERÊNCIA DE MISTURA: Se o usuário der ingredientes que não devem ser cozidos juntos (exemplo: "Uva, Ovo e Queijo"), NÃO misture tudo num prato bizarro. Sugira o preparo lógico (ex: "Ovos mexidos com queijo na frigideira, acompanhados das uvas frescas ou geladas de sobremesa").
4. TOM DE VOZ: Seja direto, objetivo e masculino. Sem frases poéticas, sem exclamações exageradas (como "Ah, meu caro!", "Nuvens douradas", "Esqueça o alho!"). Fale como um nutricionista esportivo ou um churrasqueiro prático. Nada de frescura.
5. NOMES SIMPLES: Não invente nomes gourmet para os pratos. Use nomes literais (ex: Ovos Mexidos com Queijo e Uvas).

ESTRUTURA DA RESPOSTA:
- Nome do Prato (Simples e literal)
- Tempo de Preparo (Realista)
- Ingredientes (Apenas os fornecidos + sal/manteiga se necessário)
- Modo de Preparo (Passo a passo direto, usando frigideira ou métodos simples)
- Dica Prática (Dica de ponto da carne ou temperatura)`;

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