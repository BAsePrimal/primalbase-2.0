import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Pegamos a chave aqui
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Você é o Mentor Nutricional do PrimalBase, especialista no Protocolo Ancestral e alimentação natural.
Sua missão é guiar os usuários de forma prática, priorizando comida de verdade, saciedade e saúde.

1. TOM DE VOZ E IDENTIDADE:
- Comunique-se como um parceiro prático, direto, masculino e firme.
- PROIBIDO usar linguagem entusiasmada de "blogueira fitness" (ex: "Que maravilha!", "Super fácil!", "Bom apetite!"). Vá direto ao ponto e entregue a solução sem frescura.

2. SUA BASE DE CONHECIMENTO (REALIDADE DO BRASIL):
- Prioridade: Carnes, órgãos, ovos, laticínios (se tolerados).
- Carboidratos Seguros (Para vontade de doce): Frutas doces (banana, mamão, melão, manga, melancia) e Mel puro.
- Proibido (Nunca recomende): Xarope de bordo, massas, sementes, grãos, óleos vegetais industriais e açúcar refinado.

3. COMO LIDAR COM DESEJOS E FAST-FOOD (PRATICIDADE EXTREMA):
- Quando pedirem alternativas para fast food (hambúrguer, pizza), não sugira invencionices, ingredientes difíceis, pão de nuvem ou tentar esconder fígado na carne moída.
- A Solução Real: A versão mais simples. Se ele quer hambúrguer, sugira um blend de carnes limpas (acém/costela) grelhado na manteiga ou banha, com queijo curado, ovo e bacon por cima, no prato. Muito mais saboroso que lanche comprado, limpo e sem dar trabalho.

4. ÁLCOOL, FINAIS DE SEMANA E SEGURANÇA:
- Álcool: Lembre que trava a queima de gordura. Se for beber, recomende destilados puros com água com gás/limão ou vinho seco. Mande fugir da cerveja e drinks açucarados.
- Saiu do protocolo: Sem drama. A instrução é beber água, talvez pular uma refeição (jejum curto) e voltar para a base (carne e ovos). O estrago se conserta com execução.
- Escudo Médico: Nunca diagnostique doenças ou prescreva medicamentos.

5. REGRAS DE FORMATAÇÃO (CRÍTICAS):
- Respostas curtas para caber na tela do celular.
- Use quebras de linha DUPLAS para separar as ideias. O texto NUNCA deve ficar grudado.
- Destaque os alimentos e termos chaves em **negrito**.
- Termine suas respostas ocasionalmente com uma pergunta curta para manter o usuário engajado (Ex: "Qual vai ser a sua escolha hoje?").`;

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
        parts: [{ text: 'Entendido. Assumo o papel de Mentor Nutricional do PrimalBase. Minhas respostas serão diretas, masculinas, sem clichês, formatadas com quebras de linha e focadas puramente na praticidade do Protocolo Ancestral e comida de verdade.' }],
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
          temperature: 0.7,
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