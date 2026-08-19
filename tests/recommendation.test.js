import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  InvalidPreferencesError,
  recommendTitles,
} from "../src/services/recommendation.service.js";

const sampleTitles = [
  {
    id: "perfect-match",
    title: "Combinacao perfeita",
    type: "movie",
    genres: ["acao", "aventura"],
    moods: ["emocionante", "tenso"],
    durationMinutes: 90,
    releaseYear: 2020,
    synopsis: "Titulo usado no teste.",
  },
  {
    id: "partial-match",
    title: "Combinacao parcial",
    type: "movie",
    genres: ["drama"],
    moods: ["emocionante"],
    durationMinutes: 140,
    releaseYear: 2024,
    synopsis: "Outro titulo usado no teste.",
  },
  {
    id: "wrong-type",
    title: "Tipo diferente",
    type: "series",
    genres: ["aventura"],
    moods: ["emocionante"],
    durationMinutes: 45,
    releaseYear: 2025,
    synopsis: "Serie usada no teste.",
  },
];

describe("recommendTitles", () => {
  it("ordena os titulos pela compatibilidade", async () => {
    const recommendations = await recommendTitles(
      {
        type: "movie",
        genre: "aventura",
        mood: "emocionante",
        maxDuration: 120,
      },
      sampleTitles,
    );

    assert.equal(recommendations[0].id, "perfect-match");
    assert.equal(recommendations[0].match, 100);
    assert.equal(recommendations[1].id, "partial-match");
  });

  it("retorna apenas o tipo solicitado", async () => {
    const recommendations = await recommendTitles(
      {
        type: "series",
        genre: "aventura",
        mood: "emocionante",
        maxDuration: 60,
      },
      sampleTitles,
    );

    assert.equal(recommendations.length, 1);
    assert.equal(recommendations[0].type, "series");
  });

  it("pontua proporcionalmente mais de um genero", async () => {
    const recommendations = await recommendTitles(
      {
        type: "movie",
        genres: ["acao", "aventura"],
        mood: "emocionante",
        maxDuration: 120,
      },
      sampleTitles,
    );

    assert.equal(recommendations[0].id, "perfect-match");
    assert.equal(recommendations[0].match, 100);
    assert.match(recommendations[0].reasons[0], /todos os generos/i);
  });

  it("pontua proporcionalmente mais de um clima", async () => {
    const recommendations = await recommendTitles(
      {
        type: "movie",
        genre: "aventura",
        moods: ["emocionante", "tenso"],
        maxDuration: 120,
      },
      sampleTitles,
    );

    assert.equal(recommendations[0].id, "perfect-match");
    assert.equal(recommendations[0].match, 100);
    assert.match(recommendations[0].reasons[1], /todos os climas/i);
  });

  it("rejeita preferencias incompletas", async () => {
    await assert.rejects(
      recommendTitles({ type: "movie" }, sampleTitles),
      InvalidPreferencesError,
    );
  });
});
