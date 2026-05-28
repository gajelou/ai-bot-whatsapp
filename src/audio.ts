import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import { logger } from './logger.js';

const gemini = new GoogleGenAI({
  apiKey: config.GEMINI_API_KEY,
});

export async function transcribeAudio(
  base64Audio: string,
  mimeType = 'audio/ogg'
): Promise<string | null> {
  try {
    if (!config.GEMINI_API_KEY) {
      logger.error('GEMINI_API_KEY não configurada.');
      return null;
    }

    const response = await gemini.models.generateContent({
      model: config.GEMINI_MODEL || 'gemini-2.5-flash',

      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Audio,
          },
        },
        {
          text: `
Transcreva este áudio do WhatsApp para texto em português do Brasil.

Responda APENAS com a transcrição.
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
      'Erro ao transcrever áudio com Gemini'
    );

    return null;
  }
}