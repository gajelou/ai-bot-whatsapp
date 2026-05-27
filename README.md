# WhatsApp OpenAI Venom Server

Servidor atualizado em Node.js + TypeScript usando Express, Venom Bot e OpenAI API.

> Importante: Venom usa automação do WhatsApp Web. Para uso comercial oficial e em escala, prefira a WhatsApp Business Cloud API da Meta. Use este projeto com responsabilidade, sem spam e respeitando as regras do WhatsApp.

## Instalação

```bash
npm install
cp .env.example .env
```

Edite o arquivo `.env` e coloque sua chave da OpenAI em `OPENAI_API_KEY`.

## Rodar em desenvolvimento

```bash
npm run dev
```

Ao iniciar, o terminal mostrará o QR Code. Escaneie com o WhatsApp em: **Aparelhos conectados > Conectar aparelho**.

## Rodar em produção

```bash
npm run build
npm start
```

## Endpoints

### Saúde

```http
GET /health
```

### Enviar mensagem manual

```http
POST /send
Authorization: Bearer seu_ADMIN_TOKEN
Content-Type: application/json

{
  "to": "5511999999999",
  "message": "Olá, tudo bem?"
}
```

## Estrutura

```text
src/
  config.ts
  logger.ts
  memory.ts
  openai.ts
  server.ts
  whatsapp.ts
```
