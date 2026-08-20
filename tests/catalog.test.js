import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRecommendationCatalog } from "../src/services/catalog.service.js";

const localTitles = [
  {
    id: "local-title",
    title: "Titulo local",
    type: "movie",
  },
];

const preferences = {
  type: "movie",
  genres: ["acao"],
  moods: ["emocionante"],
  maxDuration: 120,
};

describe("getRecommendationCatalog", () => {
  it("usa somente o catalogo local quando o TMDB nao esta configurado", async () => {
    const catalog = await getRecommendationCatalog(preferences, {
      localTitles,
      tmdbConfigured: false,
    });

    assert.equal(catalog, localTitles);
  });

  it("combina titulos externos e locais sem duplicar nomes", async () => {
    const externalTitle = {
      id: "tmdb-movie-1",
      title: "Titulo externo",
      type: "movie",
    };
    const externalVersionOfLocalTitle = {
      id: "tmdb-movie-2",
      title: "Titulo local",
      type: "movie",
    };

    const catalog = await getRecommendationCatalog(preferences, {
      localTitles,
      tmdbConfigured: true,
      getExternalTitles: async () => [
        externalTitle,
        externalVersionOfLocalTitle,
      ],
    });

    assert.deepEqual(
      catalog.map((title) => title.id),
      ["tmdb-movie-1", "tmdb-movie-2"],
    );
  });

  it("volta ao catalogo local quando o TMDB falha", async () => {
    const warnings = [];
    const catalog = await getRecommendationCatalog(preferences, {
      localTitles,
      tmdbConfigured: true,
      getExternalTitles: async () => {
        throw new Error("falha simulada");
      },
      logger: {
        warn: (message) => warnings.push(message),
      },
    });

    assert.equal(catalog, localTitles);
    assert.match(warnings[0], /catalogo local/i);
  });
});
