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
- API do TMDB para ampliar o catalogo
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
TMDB_ACCESS_TOKEN=seu_token_de_leitura
TMDB_LANGUAGE=pt-BR
TMDB_REGION=BR
TMDB_CANDIDATE_LIMIT=12
TMDB_CACHE_TTL_HOURS=6
```

O `TMDB_ACCESS_TOKEN` e opcional. Sem ele, o projeto usa normalmente o catalogo
local do MySQL. Com ele, o recomendador consulta filmes e series no TMDB, guarda
o resultado no MySQL pelo tempo definido em `TMDB_CACHE_TTL_HOURS` e usa o
catalogo local como fallback se a API externa falhar. Nunca envie o arquivo
`.env` para o GitHub.

Para ativar o catalogo externo:

1. Crie uma conta no [TMDB](https://www.themoviedb.org/signup).
2. Em `Settings -> API`, solicite uma chave para uso de desenvolvedor.
3. Copie o `API Read Access Token` para `TMDB_ACCESS_TOKEN` no arquivo `.env`.
4. Execute `npm run db:migrate` e reinicie o backend.

A integracao usa o `fetch` nativo do Node.js 20, sem instalar um wrapper de
terceiros para o TMDB.

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
- `external_catalog_cache`: cache temporario das consultas feitas ao TMDB.
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
  "moods": ["tenso", "reflexivo"],
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
        "Tem todos os climas que voce procura",
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
  "reply": "Entendi: um filme, generos acao + aventura, ate 120 minutos. Quais climas voce procura?",
  "context": {
    "preferences": {
      "type": "movie",
      "genres": ["acao", "aventura"],
      "maxDuration": 120
    },
    "awaiting": "moods",
    "genresConfirmed": true,
    "moodsConfirmed": false
  },
  "recommendations": [],
  "complete": false
}
```

O chat reconhece varios generos e climas na mesma frase, alem de comandos como
`mudar os generos`, `mudar os climas` e `comecar de novo`. O endpoint de
recomendacoes ainda aceita os campos antigos `genre` e `mood`, mas novos clientes
devem enviar `genres` e `moods` como listas.

## Arquitetura

Cada requisicao percorre as camadas abaixo:

```text
Route -> Controller -> Service -> Repository -> MySQL
```

- `routes`: define o metodo HTTP e o endereco.
- `controllers`: recebe a requisicao e monta a resposta HTTP.
- `services`: aplica validacoes e regras de negocio.
- `repositories`: executa queries no MySQL usando Knex.
- `services/tmdb.service.js`: consulta e normaliza dados externos do TMDB.
- `services/catalog.service.js`: combina o TMDB com o catalogo local.
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
|   |-- catalog-cache.repository.js
|   `-- titles.repository.js
|-- routes/
|   |-- chat.routes.js
|   |-- health.routes.js
|   |-- recommendations.routes.js
|   `-- titles.routes.js
|-- services/
|   |-- catalog.service.js
|   |-- chat.service.js
|   |-- recommendation.service.js
|   |-- tmdb.service.js
|   `-- titles.service.js
|-- app.js
`-- server.js
```
