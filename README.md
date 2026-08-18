# CineMatch Backend

API Node.js do CineMatch. Recebe as preferencias do usuario, calcula a compatibilidade com o catalogo e retorna as tres melhores recomendacoes.

## Tecnologias

- JavaScript com ES Modules
- Node.js
- Express
- JSON como catalogo inicial
- Node Test Runner

## Como executar

Requisito: Node.js 20 ou superior.

```bash
npm install
npm start
```

A API estara disponivel em `http://localhost:3000`.

Para executar com recarregamento automatico:

```bash
npm run dev
```

## Testes

```bash
npm test
```

## Endpoints

### Status da API

```http
GET /api/health
```

### Recomendacoes

```http
POST /api/recommendations
Content-Type: application/json
```

Exemplo:

```json
{
  "type": "movie",
  "genre": "ficcao-cientifica",
  "mood": "reflexivo",
  "maxDuration": 180
}
```

## Estrutura

```text
src/
|-- controllers/
|-- data/
|-- repositories/
|-- routes/
|-- services/
|-- app.js
`-- server.js
```

