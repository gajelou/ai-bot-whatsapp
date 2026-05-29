import { DeepgramClient } from '@deepgram/sdk';
import { logger } from './logger.js';

const deepgram = new DeepgramClient({
  apiKey: process.env.DEEPGRAM_API_KEY || '',
});

export async function transcribeAudio(
  audioBuffer: Buffer,
  messageId: string
): Promise<string | null> {
  try {
    if (!process.env.DEEPGRAM_API_KEY) {
      logger.error('DEEPGRAM_API_KEY não configurada.');
      return null;
    }

    console.log('🤖 Enviando áudio para Deepgram...');
    console.log('📦 Tamanho do áudio:', audioBuffer.length);
    console.log('🆔 ID mensagem:', messageId);

    const response =
      await deepgram.listen.v1.media.transcribeFile(
        audioBuffer,
        {
          model: 'nova-3',
          language: 'pt-BR',
          smart_format: true,
          punctuate: true,
        }
      );

    console.log(
      'DEEPGRAM RESPONSE:',
      JSON.stringify(response, null, 2)
    );

    const result = response as any;

    const transcript =
      result?.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim()
      ??
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim();

    console.log('📝 TRANSCRIÇÃO DEEPGRAM:', transcript);

    if (!transcript) {
      return null;
    }

    return transcript;
  } catch (error) {
    logger.error(
      { error },
      'Erro ao transcrever áudio com Deepgram'
    );

    return null;
  }
}