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
    const response = await gemini.models.generateContent({
      model: config.GEMINI_MODEL || 'gemini-2.5-flash',

      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Image,
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

Exemplo de resposta:

📋 Pedido:

- 2x Mini motosserra 6"
- 5x Alicate universal
- 3x Máquina de solda 220v
- 1x Trena 5m
`,
        },
      ],
    });

    const text = response.text?.trim();

    if (!text) {
      return null;
    }

    return text;
  } catch (error) {
    logger.error(
      { error },
      'Erro ao ler imagem do pedido'
    );

    return null;
  }
}