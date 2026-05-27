import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import { logger } from './logger.js';

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
    logger.warn({ error }, 'Groq falhou. Tentando Gemini...');
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
      content:
        'Você é um atendente virtual no WhatsApp. Responda sempre em português do Brasil, de forma clara, educada e objetiva.',
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
    temperature: 0.7,
    max_tokens: 700,
  });

  const answer = response.choices[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error('Groq retornou resposta vazia.');
  }

  return answer;
}

async function generateWithGemini(
  text: string,
  history: HistoryMessage[] = []
): Promise<string> {
  if (!config.GEMINI_API_KEY) {
    return 'A Groq falhou e a chave da Gemini não está configurada no servidor.';
  }

  const conversation = history
    .map((message) => {
      const role = message.role === 'assistant' ? 'Atendente' : 'Cliente';
      return `${role}: ${message.content}`;
    })
    .join('\n');

  const prompt = `
Você é o atendente virtual da Camargo & Barros Variedades.

A loja trabalha com ferramentas, utilidades domésticas, acessórios elétricos, jardinagem, mini motosserras, máquinas de solda, itens para oficina e variedades em geral.

Seu objetivo é:

* atender clientes no WhatsApp
* responder dúvidas sobre produtos
* ajudar o cliente a escolher produtos
* incentivar vendas
* responder de forma rápida, educada e objetiva
* agir como um vendedor experiente da loja

Regras importantes:

* sempre responda em português do Brasil
* use linguagem simples e amigável
* respostas curtas e naturais
* nunca diga que é inteligência artificial
* nunca invente informações técnicas
* quando não souber algo, diga que um atendente pode confirmar
* priorize atendimento rápido e comercial
* tente conduzir o cliente para finalizar compra
* quando perguntarem preço, responda de forma direta
* quando perguntarem indicação, sugira produtos conforme necessidade do cliente
* quando perguntarem sobre entrega, informe que a loja envia para todo Brasil
* quando perguntarem localização, informe:
  “A loja fica na região do Brás/Canindé em São Paulo.”

Comportamento comercial:

* seja prestativo
* sugira produtos relacionados
* destaque custo-benefício
* destaque praticidade e utilidade dos produtos
* incentive o cliente a chamar novamente

Exemplos de tom:
Cliente: “Tem mini motosserra?”
Resposta:
“Temos sim 😊 Trabalhamos com mini motosserra 6” com bateria recarregável. Ótima para poda e uso doméstico.”

Cliente: “Essa máquina de solda é boa?”
Resposta:
“Sim 😊 É um modelo muito procurado para uso doméstico e oficina leve, com ótimo custo-benefício.”

Cliente: “Vocês entregam?”
Resposta:
“Sim 😊 Enviamos para todo o Brasil.”

Cliente: “Onde fica a loja?”
Resposta:
“Estamos na região do Brás rua Valtier 363A em São Paulo.”

Nunca:

* fale sobre política
* gere respostas ofensivas
* discuta com clientes
* fale sobre concorrentes
* invente estoque
* invente prazo
* invente garantia

Se o cliente ficar confuso, seja mais simples e objetivo.
Responda sempre em português do Brasil, de forma clara, educada e objetiva.

Histórico da conversa:
${conversation || 'Sem histórico anterior.'}

Mensagem atual do cliente:
${text}
`;

  const response = await gemini.models.generateContent({
    model: config.GEMINI_MODEL,
    contents: prompt,
  });

  const answer = response.text?.trim();

  if (!answer) {
    return 'Desculpe, não consegui gerar uma resposta agora.';
  }

  return answer;
}