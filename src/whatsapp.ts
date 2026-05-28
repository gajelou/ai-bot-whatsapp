import { create, Whatsapp } from '@wppconnect-team/wppconnect';
import qrcode from 'qrcode-terminal';
import { config } from './config.js';
import { logger } from './logger.js';
import { addMessage, clearHistory, getHistory } from './memory.js';
import { generateAnswer } from './openai.js';
import mime from 'mime-types';
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

export async function sendWhatsAppText(to: string, message: string) {
  if (!client || !ready) {
    throw new Error('WhatsApp ainda não está conectado.');
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

      catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
        logger.info(
          { attempts },
          'QR Code recebido. Escaneie no WhatsApp.'
        );

        console.log('\n========================================');
        console.log('ESCANEIE O QR CODE NO WHATSAPP');
        console.log('========================================\n');

        if (asciiQR) {
          console.log(asciiQR);
        }

        if (urlCode) {
          qrcode.generate(urlCode, { small: true });
        } else {
          const qr = base64Qrimg.replace(
            /^data:image\/png;base64,/,
            ''
          );

          qrcode.generate(qr, { small: true });
        }

        console.log('\n========================================\n');
      },

      statusFind: (statusSession, session) => {
        logger.info(
          { statusSession, session },
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
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      },
    });

    ready = true;

    logger.info('WhatsApp conectado com sucesso via WPPConnect.');
    console.log('✅ WPPConnect iniciado e aguardando mensagens.');

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
      'Falha ao iniciar WPPConnect'
    );
  }
}

async function handleIncomingMessage(message: any) {
  const lockKey = String(
    message.id ||
    `${message.from}:${message.body}:${Date.now()}`
  );

  try {
    if (!client) return;

      if (
        config.ENABLE_AUDIO &&
        (message.type === 'ptt' || message.type === 'audio')
      ) {
      console.log('🎤 Áudio recebido.');

    try {
      const mediaData = await client.decryptFile(message);

      const base64Audio = mediaData.toString('base64');

      const mimeType =
        mime.lookup(message.mimetype || '') ||
        'audio/ogg';

      const transcription = await transcribeAudio(
        base64Audio,
        String(mimeType)
      );

      if (!transcription) {
        await client.sendText(
          message.from,
          'Não consegui entender o áudio 😕'
        );

        return;
      }

      console.log('📝 TRANSCRIÇÃO:', transcription);

      message.body = transcription;
    } catch (error) {
      console.error('ERRO ÁUDIO:', error);

      await client.sendText(
        message.from,
        'Tive um erro ao processar o áudio.'
      );

      return;
    }
    }

    if (
      message.type === 'image' ||
      message.type === 'document'
    ) {
      console.log('🖼️ Imagem recebida.');

      try {
        const mediaData = await client.decryptFile(message);

        const base64Image = mediaData.toString('base64');

        const mimeType =
          mime.lookup(message.mimetype || '') ||
          'image/jpeg';

        const extractedText = await readOrderImage(
          base64Image,
          String(mimeType)
        );

        if (!extractedText) {
          await client.sendText(
            message.from,
            'Não consegui ler o pedido da imagem 😕'
          );

          return;
        }

        console.log('📋 PEDIDO EXTRAÍDO:', extractedText);

        await client.sendText(
          message.from,
          extractedText
        );

        return;
      } catch (error) {
        console.error('ERRO IMAGEM:', error);

        await client.sendText(
          message.from,
          'Tive um erro ao processar a imagem.'
        );

        return;
      }
    }

    if (!message.body) return;
    if (message.fromMe) return;
    if (config.IGNORE_GROUPS && message.isGroupMsg) return;

    const chatId = message.from;
    const text = String(message.body).trim();

    if (!text) return;

    if (processing.has(lockKey)) {
      logger.info(
        { lockKey },
        'Mensagem já está em processamento.'
      );
      return;
    }

    processing.add(lockKey);

    if (text.toLowerCase() === '/ping') {
      await client.sendText(
        chatId,
        'pong ✅ Bot está recebendo mensagens pelo WPPConnect.'
      );
      return;
    }

    if (text.toLowerCase() === '/limpar') {
      await clearHistory(chatId);

      await client.sendText(
        chatId,
        'Histórico apagado. Pode me chamar de novo.'
      );

      return;
    }

    await addMessage(chatId, 'user', text);

    const history = await getHistory(chatId);

    console.log('CHAMANDO GROQ...');
    const answer = await generateAnswer(text, history);
    console.log('RESPOSTA GROQ:', answer);

    await addMessage(chatId, 'assistant', answer);

    console.log('ENVIANDO RESPOSTA...');
    await client.sendText(chatId, answer);
    console.log('RESPOSTA ENVIADA.');
  } catch (error) {
    logger.error(
      { error },
      'Erro ao processar mensagem'
    );

    try {
      await client?.sendText(
        message.from,
        'Tive um erro ao responder agora. Tente novamente em instantes.'
      );
    } catch {}
  } finally {
    processing.delete(lockKey);
  }
}