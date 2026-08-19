import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findTitleById,
  findTitles,
  InvalidTitleFiltersError,
  TitleNotFoundError,
} from "../src/services/titles.service.js";

const sampleTitles = [
  {
    id: "movie-example",
    type: "movie",
    genres: ["drama"],
    moods: ["reflexivo"],
  },
  {
    id: "series-example",
    type: "series",
    genres: ["comedia"],
    moods: ["divertido"],
  },
];

describe("titlesService", () => {
  it("filtra titulos por tipo, genero e clima", async () => {
    const titles = await findTitles(
      { type: "movie", genre: "drama", mood: "reflexivo" },
      sampleTitles,
    );

    assert.equal(titles.length, 1);
    assert.equal(titles[0].id, "movie-example");
  });

  it("busca um titulo pelo id", async () => {
    const title = await findTitleById("series-example", sampleTitles);
    assert.equal(title.type, "series");
  });

  it("rejeita um filtro de tipo invalido", async () => {
    await assert.rejects(
      findTitles({ type: "documentary" }, sampleTitles),
      InvalidTitleFiltersError,
    );
  });

  it("informa quando o titulo nao existe", async () => {
    await assert.rejects(
      findTitleById("missing-title", sampleTitles),
      TitleNotFoundError,
    );
  });
});
