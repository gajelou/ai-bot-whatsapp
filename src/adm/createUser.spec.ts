
const express = require('express');
import createUser from "./createUser";
const request = require('supertest');


jest.mock('firebase-admin', () => ({
  firestore: () => ({
    collection: () => ({
      add: jest.fn().mockResolvedValue({ id: '123abc' }) 
    })
  })
}));

const app = express();
app.use(express.json());
app.use('/register', createUser);

describe('POST /register', () => {
  it('Deve criar um usuário com sucesso', async () => {
    const response = await request(app)
      .post('/register')
      .send({ nome: 'João', phone: '999999999', senha: '123456' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', '123abc');
    expect(response.body).toHaveProperty('message', 'Usuário criado com sucesso!');
  });

  it('Deve retornar erro se algum campo estiver faltando', async () => {
    const response = await request(app)
      .post('/register')
      .send({ nome: "", phone: '999999999', senha: '123456' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Todos os campos são obrigatórios');
  });
});
