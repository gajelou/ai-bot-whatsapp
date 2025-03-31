import express from 'express';
import admin from "firebase-admin";

const createUser = express.Router();


createUser.post('/register', async (req, res) => {
  try {
    const { nome, phone, senha } = req.body;

    if (!nome || !phone || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const newUserRef = await admin.firestore().collection('configuration').add({
      nome,
      phone,
      senha,
      createdAt: new Date(),
    });

    res.status(201).json({ id: newUserRef.id, message: 'Usuário criado com sucesso!' });
  } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: 'Erro ao criar usuário', details: error.message });
        } else {
            res.status(500).json({ error: 'Erro desconhecido' });
        }  }
});

export default createUser;
