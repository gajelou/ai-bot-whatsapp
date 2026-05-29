import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

console.log('GEMINI_API_KEY:', apiKey ? 'CARREGADA' : 'VAZIA');

if (!apiKey) {
  throw new Error('GEMINI_API_KEY não encontrada no .env');
}

const ai = new GoogleGenAI({
  apiKey,
});

const models = await ai.models.list();

console.log('=== MODELOS DISPONÍVEIS ===');

for await (const model of models) {
  console.log(model.name);
}