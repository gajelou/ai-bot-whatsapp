import 'dotenv/config';

export const config = {
  PORT: Number(process.env.PORT || 3000),

  ADMIN_TOKEN: process.env.ADMIN_TOKEN || '',

  VENOM_SESSION:
    process.env.VENOM_SESSION || 'whatsapp-openai-session',

  IGNORE_GROUPS:
    String(process.env.IGNORE_GROUPS || 'true').toLowerCase() === 'true',

  MAX_HISTORY_MESSAGES: Number(process.env.MAX_HISTORY_MESSAGES || 50),

  AI_PROVIDER: process.env.AI_PROVIDER || 'auto',

  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  ENABLE_AUDIO:
  String(process.env.ENABLE_AUDIO || 'true').toLowerCase() === 'true',
};