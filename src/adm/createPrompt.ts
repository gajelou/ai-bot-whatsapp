import express from 'express';
import admin from "firebase-admin";

const createPrompt = express.Router();


createPrompt.post('/prompt', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Nenhum prompt foi fornecido.' });
    }

    const newUserRef = await admin.firestore().collection('configuration').add({
      prompt,
      createdAt: new Date(),
    });

    res.status(201).json({ id: newUserRef.id, message: 'Prompt inserido com sucesso!' });
  } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: 'Erro ao inserir prompt.', details: error.message });
        } else {
            res.status(500).json({ error: 'Erro desconhecido' });
        }  }
});

export default createPrompt;
