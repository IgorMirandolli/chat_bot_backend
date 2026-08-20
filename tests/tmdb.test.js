import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getTmdbRecommendationTitles,
  isTmdbConfigured,
  TmdbConfigurationError,
} from "../src/services/tmdb.service.js";

const preferences = {
  type: "movie",
  genres: ["acao", "aventura"],
  moods: ["emocionante"],
  maxDuration: 120,
};

function createJsonResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  };
}

describe("TMDB", () => {
  it("detecta se o token foi configurado", () => {
    assert.equal(isTmdbConfigured({ TMDB_ACCESS_TOKEN: " token " }), true);
    assert.equal(isTmdbConfigured({ TMDB_ACCESS_TOKEN: "" }), false);
  });

  it("exige um token de acesso", async () => {
    await assert.rejects(
      getTmdbRecommendationTitles(preferences, { environment: {} }),
      TmdbConfigurationError,
    );
  });

  it("consulta o discover, carrega detalhes e normaliza um filme", async () => {
    const requestedUrls = [];
    const savedCaches = [];
    const fetchImplementation = async (url) => {
      const parsedUrl = new URL(url);
      requestedUrls.push(parsedUrl);

      if (parsedUrl.pathname === "/3/discover/movie") {
        return createJsonResponse({
          results: [
            {
              id: 101,
              title: "Filme de teste",
              genre_ids: [28, 12],
              overview: "Sinopse encontrada no discover.",
              release_date: "2024-01-10",
              poster_path: "/poster.jpg",
              vote_average: 8.2,
              popularity: 90,
            },
          ],
        });
      }

      return createJsonResponse({
        id: 101,
        title: "Filme de teste",
        genres: [{ id: 28 }, { id: 12 }],
        runtime: 110,
        overview: "Sinopse detalhada.",
        release_date: "2024-01-10",
        poster_path: "/poster.jpg",
        vote_average: 8.2,
        popularity: 90,
      });
    };

    const titles = await getTmdbRecommendationTitles(preferences, {
      accessToken: "token-de-teste",
      environment: {
        TMDB_LANGUAGE: "pt-BR",
        TMDB_REGION: "BR",
      },
      fetchImplementation,
      readCachedCatalog: async () => undefined,
      writeCachedCatalog: async (...parameters) => {
        savedCaches.push(parameters);
      },
      candidateLimit: 1,
    });

    const discoverUrl = requestedUrls[0];
    assert.equal(discoverUrl.pathname, "/3/discover/movie");
    assert.equal(discoverUrl.searchParams.get("with_genres"), "28,12");
    assert.equal(discoverUrl.searchParams.get("with_runtime.lte"), "120");
    assert.equal(discoverUrl.searchParams.get("language"), "pt-BR");
    assert.equal(discoverUrl.searchParams.get("region"), "BR");
    assert.equal(requestedUrls[1].pathname, "/3/movie/101");

    assert.equal(titles[0].id, "tmdb-movie-101");
    assert.equal(titles[0].source, "tmdb");
    assert.deepEqual(titles[0].genres, ["acao", "aventura"]);
    assert.ok(titles[0].moods.includes("emocionante"));
    assert.equal(titles[0].durationMinutes, 110);
    assert.equal(titles[0].posterUrl, "https://image.tmdb.org/t/p/w500/poster.jpg");
    assert.equal(savedCaches.length, 1);
  });

  it("reutiliza o cache sem chamar a API", async () => {
    const cachedTitles = [{ id: "tmdb-movie-101" }];
    let requestCount = 0;

    const titles = await getTmdbRecommendationTitles(preferences, {
      accessToken: "token-de-teste",
      fetchImplementation: async () => {
        requestCount += 1;
        return createJsonResponse({ results: [] });
      },
      readCachedCatalog: async () => cachedTitles,
      writeCachedCatalog: async () => {},
    });

    assert.equal(titles, cachedTitles);
    assert.equal(requestCount, 0);
  });

  it("normaliza a duracao de episodio de uma serie", async () => {
    const requestedPaths = [];
    const fetchImplementation = async (url) => {
      const parsedUrl = new URL(url);
      requestedPaths.push(parsedUrl.pathname);

      if (parsedUrl.pathname === "/3/discover/tv") {
        return createJsonResponse({
          results: [
            {
              id: 202,
              name: "Serie de teste",
              genre_ids: [9648],
              first_air_date: "2023-08-01",
            },
          ],
        });
      }

      return createJsonResponse({
        id: 202,
        name: "Serie de teste",
        genres: [{ id: 9648 }],
        episode_run_time: [48],
        first_air_date: "2023-08-01",
      });
    };

    const titles = await getTmdbRecommendationTitles(
      {
        type: "series",
        genres: ["misterio"],
        moods: ["tenso"],
        maxDuration: 60,
      },
      {
        accessToken: "token-de-teste",
        fetchImplementation,
        readCachedCatalog: async () => undefined,
        writeCachedCatalog: async () => {},
        candidateLimit: 1,
      },
    );

    assert.deepEqual(requestedPaths, ["/3/discover/tv", "/3/tv/202"]);
    assert.equal(titles[0].type, "series");
    assert.equal(titles[0].title, "Serie de teste");
    assert.equal(titles[0].durationMinutes, 48);
    assert.deepEqual(titles[0].genres, ["misterio"]);
  });
});
