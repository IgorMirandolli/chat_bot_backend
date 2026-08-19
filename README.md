# CineMatch Backend

API Node.js do CineMatch. Conversa com o usuario, interpreta preferencias em
linguagem natural e calcula as tres melhores recomendacoes do catalogo.

## Tecnologias

- JavaScript com ES Modules
- Node.js
- Express
- MySQL
- Knex para migrations e queries
- mysql2
- Node Test Runner

## Como executar

Requisitos:

- Node.js 20 ou superior.
- MySQL em execucao.
- Um usuario MySQL com permissao para criar o banco e as tabelas.

Configure um arquivo `.env` usando as variaveis de `.env.example`:

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=cinematch
```

Instale as dependencias e prepare as tabelas:

```bash
npm install
npm run db:create
npm run db:migrate
npm run db:seed
npm start
```

A API estara disponivel em `http://localhost:3000`.

Para executar com recarregamento automatico:

```bash
npm run dev
```

## Testes

Testes unitarios, sem conexao com o banco:

```bash
npm test
```

Testes HTTP de integracao, depois de executar migrations e seed:

```bash
npm run test:integration
```

## Banco de dados

Criar o banco configurado em `DB_NAME`:

```bash
npm run db:create
```

Verificar a conexao:

```bash
npm run db:check
```

Ver migrations executadas e pendentes:

```bash
npm run db:status
```

Executar migrations pendentes:

```bash
npm run db:migrate
```

Desfazer o ultimo grupo de migrations:

```bash
npm run db:rollback
```

Popular o catalogo inicial:

```bash
npm run db:seed
```

Tabelas criadas:

- `titles`: dados principais, duracao, ano e classificacao indicativa.
- `genres`: generos disponiveis.
- `moods`: climas usados pela recomendacao.
- `title_genres`: relacionamento entre titulos e generos.
- `title_moods`: relacionamento entre titulos e climas.
- `knex_migrations`: controle automatico das migrations executadas.

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
  "genres": ["ficcao-cientifica", "drama"],
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
        "Combina com todos os generos escolhidos",
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

### Chat

```http
POST /api/chat
Content-Type: application/json
```

O contexto retornado pela API deve ser enviado novamente na proxima mensagem.
Assim, a conversa continua sem armazenar sessoes no servidor.

Primeira mensagem:

```json
{
  "message": "Quero um filme de acao e aventura de ate duas horas",
  "context": {}
}
```

Resposta resumida:

```json
{
  "reply": "Entendi: um filme, generos acao + aventura, ate 120 minutos. E qual clima voce procura?",
  "context": {
    "preferences": {
      "type": "movie",
      "genres": ["acao", "aventura"],
      "maxDuration": 120
    },
    "awaiting": "mood",
    "genresConfirmed": true
  },
  "recommendations": [],
  "complete": false
}
```

O chat reconhece varios generos na mesma frase e comandos como `mudar os
generos`, `mudar o clima` e `comecar de novo`. O endpoint de recomendacoes ainda
aceita o campo antigo `genre`, mas novos clientes devem enviar `genres` como uma
lista.

## Arquitetura

Cada requisicao percorre as camadas abaixo:

```text
Route -> Controller -> Service -> Repository -> MySQL
```

- `routes`: define o metodo HTTP e o endereco.
- `controllers`: recebe a requisicao e monta a resposta HTTP.
- `services`: aplica validacoes e regras de negocio.
- `repositories`: executa queries no MySQL usando Knex.
- `database/migrations`: versiona a estrutura das tabelas.
- `database/seeds`: cadastra o catalogo inicial.

## Estrutura

```text
src/
|-- controllers/
|   |-- chat.controller.js
|   |-- health.controller.js
|   |-- recommendations.controller.js
|   `-- titles.controller.js
|-- database/
|   |-- migrations/
|   |-- seeds/
|   |-- check-connection.js
|   `-- connection.js
|-- repositories/
|   `-- titles.repository.js
|-- routes/
|   |-- chat.routes.js
|   |-- health.routes.js
|   |-- recommendations.routes.js
|   `-- titles.routes.js
|-- services/
|   |-- chat.service.js
|   |-- recommendation.service.js
|   `-- titles.service.js
|-- app.js
`-- server.js
```
