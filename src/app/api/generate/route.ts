import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  let userEmail = 'Email não identificado';

  try {
    // IMPORTAÇÃO DINÂMICA DO SUPABASE (Esconde a conexão da Vercel durante o build)
    const { supabase } = await import('@/lib/supabase');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        userEmail = user.email;
      }
    } catch (authError) {
      console.log('Sem sessão ativa no build');
    }

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

    const prompt = `Você é o Chef Criativo Premium do Protocolo Ancestral (Animal-Based) focado em praticidade extrema.
Sua missão é criar uma refeição rápida e realista usando EXATAMENTE os ingredientes fornecidos pelo usuário: ${ingredients}

REGRAS ESTRITAS (LEIA COM ATENÇÃO):
1. LIMITAÇÃO DE INGREDIENTES EXTRAS: O prato principal deve ser construído EXATAMENTE com o que o usuário digitou. Você NÃO PODE inventar vegetais adicionais, carnes, carboidratos ou molhos complexos. AS ÚNICAS EXCEÇÕES PERMITIDAS (que você pode sugerir para dar sabor) são os itens básicos de despensa: temperos comuns (alho, cebola, pimenta, ervas secas), Sal (sugira o Integral/Marinho, mas aceite o comum) e uma Gordura animal para cocção (Manteiga, Banha, Ghee ou Sebo).
2. PRATICIDADE EXTREMA: Nada de suflês, bater claras em neve, usar ramequins ou forno se não for necessário. Foque em receitas de 1 frigideira. O usuário quer praticidade.
3. COERÊNCIA DE MISTURA: Se o usuário der ingredientes que não devem ser cozidos juntos (ex: "Uva, Ovo e Queijo"), NÃO misture tudo num prato bizarro. Sugira o preparo lógico (ex: "Ovos mexidos com queijo na frigideira, acompanhados das uvas frescas ou geladas de sobremesa").
4. TOM DE VOZ: Seja direto, objetivo e premium. Fale como um Especialista em Alta Performance focado na prática diária. Nada de termos médicos complexos ou jargões de laboratório. Seja o treinador que descomplica a cozinha (sem frescura, adulto e direto ao ponto).
5. NOMES SIMPLES: Não invente nomes gourmet para os pratos. Use nomes literais e diretos.

SAÍDA OBRIGATÓRIA (JSON ESTREITO):
Você DEVE retornar APENAS um objeto JSON válido, sem NENHUM texto antes ou depois, sem formatação markdown, com esta exata estrutura:
{
  "title": "Nome do Prato (Simples e literal)",
  "prep_time": "Ex: 10 min",
  "macros": "Ex: Alta Proteína",
  "ingredients": ["item 1", "item 2"],
  "instructions": ["Passo 1 direto", "Passo 2 direto"],
  "tip": "Dica prática sobre o preparo conectando o prato ao bem-estar biológico (ex: saciedade, foco ou energia limpa)."
}`;

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

    // Limpeza pesada para garantir que o JSON não quebre o Frontend
    const cleanJsonText = recipeText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let recipeData;
    try {
      recipeData = JSON.parse(cleanJsonText);
    } catch (parseError) {
      console.error('A IA falhou em gerar o JSON estruturado. Texto cru:', cleanJsonText);
      throw new Error('Falha ao decodificar a estrutura da receita.');
    }

    // Retorna o JSON limpo e estruturado para o frontend desenhar a tela premium
    return NextResponse.json({ recipe: recipeData });

  } catch (error: any) {
    // IMPORTAÇÃO DINÂMICA DO LOGGER
    try {
      const { logError } = await import('@/lib/logger');
      await logError('IA Chef (Receitas)', error, userEmail);
    } catch (logErr) {
      console.log('Erro ao salvar log de receita');
    }

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