import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  InvalidChatRequestError,
  processChatMessage,
} from "../src/services/chat.service.js";

const sampleTitles = [
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
    assert.equal(result.context.awaiting, "genre");
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

  it("permite mudar uma preferencia depois do resultado", async () => {
    const result = await processChatMessage(
      {
        message: "Quero mudar o genero",
        context: {
          preferences: {
            type: "movie",
            genre: "comedia",
            mood: "divertido",
            maxDuration: 120,
          },
        },
      },
      sampleTitles,
    );

    assert.equal(result.complete, false);
    assert.equal(result.context.awaiting, "genre");
    assert.equal(result.context.preferences.genre, undefined);
  });

  it("reinicia a conversa e limpa as preferencias", async () => {
    const result = await processChatMessage(
      {
        message: "Quero comecar de novo",
        context: {
          preferences: {
            type: "movie",
            genre: "comedia",
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
