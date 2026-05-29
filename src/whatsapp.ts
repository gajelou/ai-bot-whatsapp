import { create, Whatsapp } from '@wppconnect-team/wppconnect';
import qrcode from 'qrcode-terminal';

import { config } from './config.js';
import { logger } from './logger.js';

import {
  addMessage,
  clearHistory,
  getHistory,
} from './memory.js';

import { generateAnswer } from './openai.js';
import { transcribeAudio } from './audio.js';
import { readOrderImage } from './image.js';

let client: Whatsapp | null = null;
let ready = false;

const processing = new Set<string>();

export function getWhatsAppStatus() {
  return {
    ready,
    session: config.VENOM_SESSION,
  };
}

export async function sendWhatsAppText(
  to: string,
  message: string
) {
  if (!client || !ready) {
    throw new Error(
      'WhatsApp ainda não está conectado.'
    );
  }

  const phone = to.includes('@c.us')
    ? to
    : `${to.replace(/\D/g, '')}@c.us`;

  return client.sendText(phone, message);
}

export async function startWhatsApp() {
  try {
    client = await create({
      session: config.VENOM_SESSION,

      catchQR: (
        base64Qrimg,
        asciiQR,
        attempts,
        urlCode
      ) => {
        logger.info(
          { attempts },
          'QR Code recebido.'
        );

        console.log('\n========================================');
        console.log('ESCANEIE O QR CODE NO WHATSAPP');
        console.log('========================================\n');

        if (asciiQR) {
          console.log(asciiQR);
        }

        if (urlCode) {
          qrcode.generate(urlCode, {
            small: true,
          });
        } else {
          const qr = base64Qrimg.replace(
            /^data:image\/png;base64,/,
            ''
          );

          qrcode.generate(qr, {
            small: true,
          });
        }

        console.log('\n========================================\n');
      },

      statusFind: (statusSession, session) => {
        logger.info(
          {
            statusSession,
            session,
          },
          'Status da sessão WPPConnect'
        );

        if (
          statusSession === 'inChat' ||
          statusSession === 'isLogged' ||
          statusSession === 'qrReadSuccess'
        ) {
          ready = true;
        }

        if (
          statusSession === 'notLogged' ||
          statusSession === 'browserClose' ||
          statusSession === 'serverClose' ||
          statusSession === 'disconnectedMobile'
        ) {
          ready = false;
        }
      },

      headless: false,
      logQR: true,
      autoClose: 0,
      tokenStore: 'file',

      puppeteerOptions: {
        executablePath:
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',

        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      },
    });

    ready = true;

    logger.info(
      'WhatsApp conectado com sucesso.'
    );

    console.log('✅ WPPConnect iniciado.');

    client.onMessage(async (message) => {
      console.log('🔥 MENSAGEM RECEBIDA:', {
        id: message.id,
        from: message.from,
        body: message.body,
        fromMe: message.fromMe,
        isGroupMsg: message.isGroupMsg,
        type: message.type,
      });

      await handleIncomingMessage(message);
    });
  } catch (error) {
    ready = false;

    logger.error(
      { error },
      'Falha ao iniciar WhatsApp'
    );
  }
}

async function handleIncomingMessage(message: any) {
  if (!client) return;

  const lockKey = String(
    message.id ||
      `${message.from}:${message.body}:${Date.now()}`
  );

  try {
    if (!message) return;
    if (message.fromMe) return;

    if (
      config.IGNORE_GROUPS &&
      message.isGroupMsg
    ) {
      return;
    }

    console.log('➡️ Processando mensagem:', {
      id: message.id,
      from: message.from,
      body: message.body,
      type: message.type,
    });

    if (processing.has(lockKey)) {
      return;
    }

    processing.add(lockKey);

    // =========================
    // ÁUDIO
    // =========================

    if (
      config.ENABLE_AUDIO &&
      (message.type === 'ptt' ||
        message.type === 'audio')
    ) {
      console.log('🎤 Áudio recebido.');

      try {
        const mediaData =
          await (client as any).decryptFile(
            message
          );

        let audioBuffer: Buffer;

        if (Buffer.isBuffer(mediaData)) {
          audioBuffer = mediaData;
        } else if (
          typeof mediaData === 'string'
        ) {
          const base64 = mediaData.includes(',')
            ? mediaData.split(',')[1]
            : mediaData;

          audioBuffer = Buffer.from(
            base64,
            'base64'
          );
        } else {
          throw new Error(
            'Formato de áudio inválido retornado pelo WPPConnect.'
          );
        }

        console.log(
          '📦 Tamanho do áudio:',
          audioBuffer.length
        );

        if (audioBuffer.length < 1000) {
          throw new Error(
            'Áudio vazio ou inválido.'
          );
        }

        const transcription =
          await transcribeAudio(
            audioBuffer,
            String(message.id)
          );

        if (!transcription) {
          await client.sendText(
            message.from,
            'Não consegui entender o áudio 😕'
          );

          return;
        }

        console.log(
          '📝 TRANSCRIÇÃO:',
          transcription
        );

        message.body = transcription;
      } catch (error) {
        console.error(
          '❌ ERRO ÁUDIO:',
          error
        );

        await client.sendText(
          message.from,
          'Tive um erro ao processar o áudio.'
        );

        return;
      }
    }

    // =========================
    // IMAGEM
    // =========================

    if (message.type === 'image') {
  console.log('🖼️ Imagem recebida.');

  try {
    let imageBuffer: Buffer | null = null;

    const mediaData = await (client as any).decryptFile(message);

    if (Buffer.isBuffer(mediaData)) {
      imageBuffer = mediaData;
    } else if (typeof mediaData === 'string') {
      const base64 = mediaData.includes(',')
        ? mediaData.split(',')[1]
        : mediaData;

      imageBuffer = Buffer.from(base64, 'base64');
    }

    if (!imageBuffer || imageBuffer.length < 2000) {
      console.log(
        '⚠️ decryptFile não trouxe imagem completa. Tentando body...'
      );

      if (typeof message.body === 'string' && message.body.length > 2000) {
        const base64 = message.body.includes(',')
          ? message.body.split(',')[1]
          : message.body;

        imageBuffer = Buffer.from(base64, 'base64');
      }
    }

    if (!imageBuffer || imageBuffer.length < 2000) {
      throw new Error(
        `Imagem muito pequena ou inválida. Tamanho: ${imageBuffer?.length || 0}`
      );
    }

    const base64Image = imageBuffer.toString('base64');

    console.log('📦 Tamanho buffer imagem:', imageBuffer.length);
    console.log('📦 Tamanho base64 imagem:', base64Image.length);

    const extractedText = await readOrderImage(
      base64Image,
      'image/jpeg'
    );

    if (!extractedText) {
      await client.sendText(
        message.from,
        'Não consegui ler a imagem 😕'
      );

      return;
    }

    console.log('📋 TEXTO EXTRAÍDO:', extractedText);

    await client.sendText(message.from, extractedText);

    return;
  } catch (error) {
    console.error('❌ ERRO IMAGEM:', error);

    await client.sendText(
      message.from,
      'Tive um erro ao processar a imagem. Pode tentar enviar a foto novamente em melhor qualidade?'
    );

    return;
  }
}

    const text = String(
      message.body || ''
    ).trim();

    if (!text) return;

    // =========================
    // COMANDOS
    // =========================

    if (text.toLowerCase() === '/ping') {
      await client.sendText(
        message.from,
        'pong ✅ Bot funcionando.'
      );

      return;
    }

    if (text.toLowerCase() === '/limpar') {
      await clearHistory(message.from);

      await client.sendText(
        message.from,
        '✅ Histórico apagado.'
      );

      return;
    }

    // =========================
    // IA
    // =========================

    console.log(
      '💾 Salvando mensagem usuário...'
    );

    await addMessage(
      message.from,
      'user',
      text
    );

    const history = await getHistory(
      message.from
    );

    console.log(
      '🤖 Gerando resposta IA...'
    );

    const answer = await generateAnswer(
      text,
      history
    );

    console.log(
      '📝 RESPOSTA IA:',
      answer
    );

    await addMessage(
      message.from,
      'assistant',
      answer
    );

    console.log(
      '📤 Enviando resposta...'
    );

    await client.sendText(
      message.from,
      answer
    );

    console.log(
      '✅ Resposta enviada.'
    );
  } catch (error) {
    logger.error(
      { error },
      'Erro ao processar mensagem'
    );

    try {
      await client.sendText(
        message.from,
        'Tive um erro ao responder 😕'
      );
    } catch {}
  } finally {
    processing.delete(lockKey);
  }
}