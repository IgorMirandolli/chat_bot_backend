# CineMatch Backend

API Node.js do CineMatch. Lista o catalogo, consulta titulos e calcula as tres melhores recomendacoes a partir das preferencias do usuario.

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

### Informacoes da API

```http
GET /
```

Retorna o nome da aplicacao e a lista de endpoints disponiveis.

### Status da API

```http
GET /api/health
```

Resposta `200`:

```json
{
  "status": "ok",
  "application": "CineMatch API",
  "timestamp": "2026-08-19T12:00:00.000Z"
}
```

### Listar titulos

```http
GET /api/titles
```

Filtros opcionais:

```http
GET /api/titles?type=movie&genre=drama&mood=reflexivo
```

Valores aceitos em `type`: `movie` e `series`.

Resposta `200`:

```json
{
  "count": 1,
  "titles": []
}
```

### Buscar titulo por ID

```http
GET /api/titles/:id
```

Exemplo:

```http
GET /api/titles/interestelar
```

Retorna `200` com o titulo ou `404` quando o ID nao existe.

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

Resposta `200`:

```json
{
  "recommendations": [
    {
      "id": "a-chegada",
      "title": "A Chegada",
      "match": 100,
      "reasons": [
        "Combina com o genero escolhido",
        "Tem o clima que voce procura",
        "Cabe no seu tempo disponivel"
      ]
    }
  ]
}
```

Preferencias invalidas retornam `400` neste formato:

```json
{
  "error": "Descricao do problema."
}
```

## Arquitetura

Cada requisicao percorre as camadas abaixo:

```text
Route -> Controller -> Service -> Repository -> catalogo JSON
```

- `routes`: define o metodo HTTP e o endereco.
- `controllers`: recebe a requisicao e monta a resposta HTTP.
- `services`: aplica validacoes e regras de negocio.
- `repositories`: acessa os dados do catalogo.
- `data`: armazena os dados enquanto o banco nao e implementado.

## Estrutura

```text
src/
|-- controllers/
|   |-- health.controller.js
|   |-- recommendations.controller.js
|   `-- titles.controller.js
|-- data/
|   `-- titles.json
|-- repositories/
|   `-- titles.repository.js
|-- routes/
|   |-- health.routes.js
|   |-- recommendations.routes.js
|   `-- titles.routes.js
|-- services/
|   |-- recommendation.service.js
|   `-- titles.service.js
|-- app.js
`-- server.js
```
