'use server'
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateRecipe(ingredientes: string, apiKeyClient: string) {
  try {
    // 1. Verificação de Segurança (Debug)
    if (!apiKeyClient || apiKeyClient.length < 10) {
      return "ERRO DE DEBUG: A chave Client-Side chegou vazia ou inválida. Verifique o envio no front-end.";
    }
    
    // 2. Inicialização Correta (Force o uso do argumento)
    const genAI = new GoogleGenerativeAI(apiKeyClient);
    
    // Usa o modelo Gemini 2.5 Flash (versão estável disponível)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 8192,
      },
    });

    const prompt = `Você é um Chef Ancestral Sábio e Prático. Sua filosofia é: menos é mais. O foco é a TÉCNICA de preparo, não a lista de compras.

REGRAS OBRIGATÓRIAS:
- INTRODUÇÃO CURTA: Máximo 3 linhas. Sem aulas de história longas.
- INGREDIENTES REAIS: Se o usuário der 1 ingrediente (ex: Peixe), use APENAS ele e itens básicos de despensa (sal, óleo/gordura, alho, cebola, fogo). NÃO invente ingredientes exóticos (folhas de bananeira, raízes raras) a menos que o usuário peça.
- FOCO NO PREPARO: Ensine a extrair o máximo de sabor do ingrediente simples usando técnicas rústicas (calor, tempo, corte).
- LINGUAGEM: Direta, acolhedora, mas sem enrolação.

Ingredientes disponíveis: ${ingredientes}

Formate a resposta em Markdown com:
# Nome da Receita
## Ingredientes
## Modo de Preparo
## Dicas do Chef`;

    // Gera a receita com timeout
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: API demorou muito para responder')), 30000)
      )
    ]) as any;

    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      return '🔴 ERRO DO SERVIDOR: API retornou resposta vazia';
    }
    
    return text;
    
  } catch (error: any) {
    // Log detalhado do erro (visível nos logs do servidor)
    console.error('❌ Erro detalhado ao gerar receita:', {
      message: error?.message,
      status: error?.status,
      statusText: error?.statusText,
      name: error?.name,
      stack: error?.stack
    });
    
    // MODO DEBUG: Retorna o erro exato em vez de throw
    // Mensagens de erro específicas e acionáveis
    if (error?.message?.includes('API_KEY_INVALID') || error?.message?.includes('API key')) {
      return '🔴 ERRO DO SERVIDOR: Chave da API inválida - ' + error.message;
    }
    
    if (error?.message?.includes('models/gemini') || error?.message?.includes('model')) {
      return '🔴 ERRO DO SERVIDOR: Modelo não disponível - ' + error.message;
    }
    
    if (error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return '🔴 ERRO DO SERVIDOR: Limite de uso da API atingido - ' + error.message;
    }
    
    if (error?.message?.includes('Timeout')) {
      return '🔴 ERRO DO SERVIDOR: Timeout - A API demorou muito para responder';
    }

    if (error?.message?.includes('fetch failed') || error?.message?.includes('network')) {
      return '🔴 ERRO DO SERVIDOR: Erro de conexão com a API do Google - ' + error.message;
    }
    
    // Erro genérico com detalhes completos
    return `🔴 ERRO DO SERVIDOR: ${error?.message || 'Erro desconhecido'} | Nome: ${error?.name || 'N/A'} | Status: ${error?.status || 'N/A'}`;
  }
}

// Forçando atualização de cache

// Forçando atualização de cache

// Forçando atualização de cache

// Forçando atualização de cache

// Forçando atualização de cache
