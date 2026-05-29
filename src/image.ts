import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import { logger } from './logger.js';

const gemini = new GoogleGenAI({
  apiKey: config.GEMINI_API_KEY,
});

export async function readOrderImage(
  base64Image: string,
  mimeType = 'image/jpeg'
): Promise<string | null> {
  try {
    if (!config.GEMINI_API_KEY) {
      logger.error('GEMINI_API_KEY não configurada.');
      return null;
    }

    const cleanBase64 = base64Image.includes(',')
      ? base64Image.split(',')[1]
      : base64Image;

    console.log('📦 Enviando imagem para Gemini:', {
      mimeType,
      base64Length: cleanBase64.length,
      model: config.GEMINI_MODEL,
    });

    const response = await gemini.models.generateContent({
      model: config.GEMINI_MODEL || 'gemini-2.0-flash',

      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: `
Leia esta imagem de um pedido escrito à mão.

Extraia e organize os produtos em formato profissional.

Regras:
- organize em lista
- corrija palavras quando fizer sentido
- mantenha quantidades
- mantenha medidas
- responda apenas com o pedido organizado
- não invente produtos
- português do Brasil
`,
        },
      ],

      config: {
        temperature: 0.1,
        topP: 0.2,
        topK: 10,
      },
    });

    const text = response.text?.trim();

    if (!text) return null;

    return text;
  } catch (error: any) {
    logger.error(
      {
        name: error?.name,
        status: error?.status,
        message: error?.message,
        details: error?.errorDetails || error?.details,
      },
      'Erro ao ler imagem do pedido'
    );

    return null;
  }
}