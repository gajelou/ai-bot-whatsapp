import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';

export type Role = 'user' | 'assistant';
export type ChatMessage = { role: Role; content: string; at: string };

type Store = Record<string, ChatMessage[]>;

const dataDir = path.resolve(process.cwd(), 'data');
const dbFile = path.join(dataDir, 'conversations.json');
let store: Store = {};
let loaded = false;

async function loadStore() {
  if (loaded) return;
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(dbFile, 'utf8');
    store = JSON.parse(raw) as Store;
  } catch {
    store = {};
  }
  loaded = true;
}

async function saveStore() {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbFile, JSON.stringify(store, null, 2), 'utf8');
}

export async function getHistory(chatId: string) {
  await loadStore();
  return store[chatId] ?? [];
}

export async function addMessage(chatId: string, role: Role, content: string) {
  await loadStore();
  const list = store[chatId] ?? [];
  list.push({ role, content, at: new Date().toISOString() });
  store[chatId] = list.slice(-config.MAX_HISTORY_MESSAGES);
  await saveStore();
}

export async function clearHistory(chatId: string) {
  await loadStore();
  delete store[chatId];
  await saveStore();
}
