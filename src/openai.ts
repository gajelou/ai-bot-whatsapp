import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import { logger } from './logger.js';

const SYSTEM_PROMPT = `
Você é o atendente virtual oficial da Camargo & Barros Variedades.

Seu nome é Camarguinho.

A loja trabalha com:
- ferramentas
- mini motosserras
- máquinas de solda
- jardinagem
- elétrica
- oficina
- utilidades domésticas
- variedades

INFORMAÇÕES IMPORTANTES:
- Loja localizada na Rua Valtier 363A, Brás, São Paulo
- Enviamos para todo Brasil
- Link catálogo:
https://gajelou.github.io/scraper_ceb_front/

Contatos humanos:
- (11)94013-2970
- (11)99929-4923

REGRAS OBRIGATÓRIAS:
- Responda sempre em português do Brasil
- Seja objetivo
- Seja comercial
- Seja educado
- Use linguagem simples
- Respostas curtas e naturais
- Nunca diga que é inteligência artificial
- Nunca invente informações
- Nunca invente estoque
- Nunca invente preço
- Nunca invente garantia
- Nunca invente especificações técnicas
- Nunca invente prazo
- Nunca invente disponibilidade
- Nunca invente potência
- Nunca invente informações de bateria
- Nunca invente voltagem
- Nunca invente características técnicas

REGRA MAIS IMPORTANTE:
Se não souber uma informação:

"Vou confirmar essa informação certinha para você 😊"

ou

"Posso pedir para um atendente confirmar certinho 😊"

Você nunca deve:
- falar sobre política
- falar sobre religião
- discutir com clientes
- falar palavrão
- falar sobre concorrentes
- responder assuntos fora da loja

COMPORTAMENTO:
- Seja prestativo
- Sugira produtos relacionados
- Destaque custo-benefício
- Destaque praticidade
- Incentive a compra de forma leve

QUANDO O CLIENTE MANDAR:
- áudio → responda normalmente
- imagem → organize informações
- pedido manuscrito → transforme em lista organizada

ENDEREÇO:
"Estamos na região do Brás, Rua Valtier 363A em São Paulo 😊"

ENTREGA:
"Enviamos para todo o Brasil 😊"

É MELHOR dizer que não sabe do que inventar informações.
`;

const groq = new Groq({
  apiKey: config.GROQ_API_KEY,
});

const gemini = new GoogleGenAI({
  apiKey: config.GEMINI_API_KEY,
});

type ChatRole = 'user' | 'assistant' | 'system';

type HistoryMessage = {
  role: ChatRole;
  content: string;
};

export async function generateAnswer(
  text: string,
  history: HistoryMessage[] = []
): Promise<string> {
  if (config.AI_PROVIDER === 'groq') {
    return generateWithGroq(text, history);
  }

  if (config.AI_PROVIDER === 'gemini') {
    return generateWithGemini(text, history);
  }

  try {
    return await generateWithGroq(text, history);
  } catch (error) {
    logger.warn(
      { error },
      'Groq falhou. Tentando Gemini...'
    );

    return generateWithGemini(text, history);
  }
}

async function generateWithGroq(
  text: string,
  history: HistoryMessage[] = []
): Promise<string> {
  if (!config.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurada.');
  }

  const messages = [
    {
      role: 'system' as const,
      content: SYSTEM_PROMPT,
    },

    ...history.map((message) => ({
      role: message.role as 'user' | 'assistant',
      content: message.content,
    })),

    {
      role: 'user' as const,
      content: text,
    },
  ];

  const response = await groq.chat.completions.create({
    model: config.GROQ_MODEL,

    messages,

    temperature: 0.1,

    top_p: 0.2,

    max_tokens: 500,
  });

  const answer =
    response.choices[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error(
      'Groq retornou resposta vazia.'
    );
  }

  return sanitizeAnswer(answer);
}

async function generateWithGemini(
  text: string,
  history: HistoryMessage[] = []
): Promise<string> {
  if (!config.GEMINI_API_KEY) {
    return 'A Groq falhou e a chave da Gemini não está configurada.';
  }

  const conversation = history
    .map((message) => {
      const role =
        message.role === 'assistant'
          ? 'Atendente'
          : 'Cliente';

      return `${role}: ${message.content}`;
    })
    .join('\n');

  const prompt = `
${SYSTEM_PROMPT}

Histórico da conversa:
${conversation || 'Sem histórico anterior.'}

Mensagem atual do cliente:
${text}
`;

  const response = await gemini.models.generateContent({
    model: config.GEMINI_MODEL,

    contents: prompt,

    config: {
      temperature: 0.1,
      topP: 0.2,
      topK: 10,
    },
  });

  const answer = response.text?.trim();

  if (!answer) {
    return 'Desculpe, não consegui gerar uma resposta agora.';
  }

  return sanitizeAnswer(answer);
}

function sanitizeAnswer(answer: string): string {
  const forbiddenPatterns = [
    '3500w',
    '5000w',
    '8000mah',
    'samsung',
    'brushless',
    'últimas unidades',
    'temos em estoque',
    'garantia de',
  ];

  const lowerAnswer = answer.toLowerCase();

  const containsForbidden = forbiddenPatterns.some(
    (pattern) =>
      lowerAnswer.includes(pattern.toLowerCase())
  );

  if (containsForbidden) {
    return `
Vou confirmar essa informação certinha para você 😊
`;
  }

  return answer;
}