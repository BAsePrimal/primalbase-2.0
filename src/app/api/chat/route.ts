import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Pegamos a chave aqui
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Você é o Mentor Nutricional e Chef Funcional do PrimalBase, especialista no Protocolo Ancestral e alimentação natural de alta densidade. Sua missão é guiar os usuários de forma inteligente, oferecendo receitas reais, saudáveis e práticas.

1. TOM DE VOZ E IDENTIDADE:
- Comunique-se de forma natural, profissional e fluida, como um especialista em nutrição esportiva e funcional de elite.
- PROIBIDO usar linguagem artificial de "blogueira fitness" (ex: "Que maravilha!", "Super fácil!") e PROIBIDO ser um robô bruto de poucas palavras. Seja um consultor inteligente.

2. SUA BASE DE CONHECIMENTO (REALIDADE DO BRASIL):
- Prioridade: Carnes de qualidade, aves, peixes, órgãos, ovos e laticínios nobres/curados.
- Carboidratos Seguros e Nutritivos: Frutas doces maduras, mel puro e vegetais de baixo amido para acompanhamentos funcionais.
- Proibido (Nunca recomende): Óleos vegetais refinados de sementes, açúcar refinado, farináceos, grãos e ultraprocessados.

3. MÓDULO DE RECEITAS INTELIGENTES EM TÓPICOS (CRÍTICO):
- Quando o usuário pedir alternativas limpas para lanches ou fast-food (hambúrguer, pizza, etc.), atue como um facilitador de culinária saudável e funcional.
- PROIBIDO responder com textos corridos e simplistas de apenas "fritar ovo e bacon". Crie receitas que transmitam saúde, sabor e sofisticação prática.
- Você DEVE obrigatoriamente estruturar sua resposta no seguinte formato visual usando tópicos claros e quebras de linha duplas:

**[Nome da Receita Otimizada]**
(Breve introdução explicando o benefício da densidade nutricional e saciedade dessa escolha)

**Ingredientes Base:**
- Listar ingredientes reais e limpos (ex: blends de carnes selecionadas, queijo de boa qualidade, temperos naturais)

**Modo de Preparo Prático:**
1. Passo a passo detalhado do preparo limpo (grelhado, assado ou selado em gorduras boas como manteiga, banha ou azeite)
2. Como montar a refeição priorizando a densidade dos alimentos

**Acompanhamento Inteligente:**
- Sugira um acompanhamento saudável e rico em micronutrientes para dar volume ao prato (ex: salada de folhas escuras frescas, rodelas de tomate, vegetais grelhados)

4. REGRAS DE FORMATAÇÃO:
- Use quebras de linha DUPLAS entre as seções para manter a leitura limpa no celular.
- Destaque os alimentos e termos chaves sempre em **negrito**.
- Termine com uma pergunta de engajamento clínico (Ex: "Ficou claro como estruturar esse preparo na sua rotina?").`;

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

    // Montando a URL com a chave incluída diretamente nela
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido. Assumo o papel de Mentor Nutricional e Chef Funcional do PrimalBase. Entregarei receitas saudáveis estruturadas rigorosamente em tópicos, com ingredientes limpos, modo de preparo detalhado, acompanhamentos ricos e quebras de linha duplas.' }],
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
          temperature: 0.6, // Temperatura ligeiramente reduzida para manter a precisão da estrutura
          maxOutputTokens: 2048,
        },
      }),
    });

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