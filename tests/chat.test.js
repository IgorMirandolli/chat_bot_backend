import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  InvalidChatRequestError,
  processChatMessage,
} from "../src/services/chat.service.js";

const sampleTitles = [
  {
    id: "acao-aventura",
    title: "Acao e aventura",
    type: "movie",
    genres: ["acao", "aventura"],
    moods: ["emocionante"],
    durationMinutes: 110,
    releaseYear: 2025,
    synopsis: "Titulo com dois generos usado no teste do chat.",
  },
  {
    id: "comedia-curta",
    title: "Comedia curta",
    type: "movie",
    genres: ["comedia"],
    moods: ["divertido"],
    durationMinutes: 95,
    releaseYear: 2024,
    synopsis: "Titulo usado no teste do chat.",
  },
  {
    id: "drama-longo",
    title: "Drama longo",
    type: "movie",
    genres: ["drama"],
    moods: ["reflexivo"],
    durationMinutes: 150,
    releaseYear: 2023,
    synopsis: "Outro titulo usado no teste do chat.",
  },
];

describe("processChatMessage", () => {
  it("inicia a conversa perguntando o tipo", async () => {
    const result = await processChatMessage({ message: "", context: {} }, sampleTitles);

    assert.equal(result.complete, false);
    assert.equal(result.context.awaiting, "type");
    assert.equal(result.quickReplies.length, 2);
    assert.match(result.reply, /filme ou uma s\u00e9rie/i);
  });

  it("reconhece varias preferencias em uma frase", async () => {
    const result = await processChatMessage(
      {
        message: "Quero um filme divertido de ate duas horas",
        context: {},
      },
      sampleTitles,
    );

    assert.deepEqual(result.context.preferences, {
      type: "movie",
      mood: "divertido",
      maxDuration: 120,
    });
    assert.equal(result.context.awaiting, "genres");
    assert.equal(result.recommendations.length, 0);
  });

  it("continua a conversa e retorna recomendacoes", async () => {
    const result = await processChatMessage(
      {
        message: "Comedia",
        context: {
          preferences: {
            type: "movie",
            mood: "divertido",
            maxDuration: 120,
          },
        },
      },
      sampleTitles,
    );

    assert.equal(result.complete, true);
    assert.equal(result.context.awaiting, null);
    assert.equal(result.recommendations[0].id, "comedia-curta");
    assert.equal(result.recommendations[0].match, 100);
  });

  it("reconhece mais de um genero na mesma mensagem", async () => {
    const result = await processChatMessage(
      {
        message: "Quero um filme de acao e aventura emocionante de ate duas horas",
        context: {},
      },
      sampleTitles,
    );

    assert.deepEqual(result.context.preferences.genres, ["acao", "aventura"]);
    assert.equal(result.complete, true);
    assert.equal(result.recommendations[0].id, "acao-aventura");
    assert.equal(result.recommendations[0].match, 100);
  });

  it("acumula generos escolhidos antes de continuar", async () => {
    const firstResult = await processChatMessage(
      {
        message: "Acao",
        context: {
          preferences: { type: "movie" },
          genresConfirmed: false,
        },
      },
      sampleTitles,
    );

    const secondResult = await processChatMessage(
      {
        message: "Aventura",
        context: firstResult.context,
      },
      sampleTitles,
    );

    assert.deepEqual(secondResult.context.preferences.genres, ["acao", "aventura"]);
    assert.equal(secondResult.context.awaiting, "genres");
    assert.ok(
      secondResult.quickReplies.some((reply) =>
        /continuar com esses/i.test(reply.label),
      ),
    );
  });

  it("permite mudar uma preferencia depois do resultado", async () => {
    const result = await processChatMessage(
      {
        message: "Quero mudar o genero",
        context: {
          preferences: {
            type: "movie",
            genres: ["comedia"],
            mood: "divertido",
            maxDuration: 120,
          },
        },
      },
      sampleTitles,
    );

    assert.equal(result.complete, false);
    assert.equal(result.context.awaiting, "genres");
    assert.equal(result.context.preferences.genres, undefined);
  });

  it("reinicia a conversa e limpa as preferencias", async () => {
    const result = await processChatMessage(
      {
        message: "Quero comecar de novo",
        context: {
          preferences: {
            type: "movie",
            genres: ["comedia"],
          },
        },
      },
      sampleTitles,
    );

    assert.deepEqual(result.context.preferences, {});
    assert.equal(result.context.awaiting, "type");
  });

  it("rejeita mensagens fora do contrato", async () => {
    await assert.rejects(
      processChatMessage({ message: 123 }, sampleTitles),
      InvalidChatRequestError,
    );
  });
});
