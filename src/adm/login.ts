import express from 'express';
import admin from 'firebase-admin';

import dotenv from 'dotenv';
import auth from '../auth/auth';

dotenv.config(); 

const login = express.Router();

login.post('/login', async (req, res) => {
  try {
    const { phone, senha } = req.body;

    if (!phone || !senha) {
      return res.status(400).json({ error: 'Phone e senha são obrigatórios' });
    }

    const usersRef = admin.firestore().collection('configuration');
    const querySnapshot = await usersRef.where('phone', '==', phone).get();

    if (querySnapshot.empty) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.senha !== senha) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    
    const token = auth.generateToken(
       userDoc.id 
      
    );

    res.json({ message: 'Login bem-sucedido!', token });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

export default login;
