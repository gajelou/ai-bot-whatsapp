import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { logger } from './logger.js';
import { getWhatsAppStatus, sendWhatsAppText, startWhatsApp } from './whatsapp.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  if (token !== config.ADMIN_TOKEN) return res.status(401).json({ error: 'Não autorizado' });
  next();
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, whatsapp: getWhatsAppStatus() });
});

app.post('/send', requireAdmin, async (req, res) => {
  const { to, message } = req.body ?? {};
  if (!to || !message) return res.status(400).json({ error: 'Informe to e message.' });

  try {
    await sendWhatsAppText(String(to), String(message));
    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, 'Erro ao enviar mensagem manual');
    res.status(500).json({ error: 'Falha ao enviar mensagem.' });
  }
});

app.listen(config.PORT, () => {
  logger.info(`Servidor HTTP rodando na porta ${config.PORT}`);
});

startWhatsApp().catch((error) => {
  logger.error({ error }, 'Falha ao iniciar WhatsApp');
  process.exit(1);
});
