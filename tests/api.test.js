import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createApp } from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = createApp().listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

describe("CineMatch API", () => {
  it("informa que a API esta funcionando", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.equal(body.application, "CineMatch API");
    assert.ok(body.timestamp);
  });

  it("lista os titulos e permite filtros", async () => {
    const response = await fetch(
      `${baseUrl}/api/titles?type=movie&genre=ficcao-cientifica`,
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.count, 2);
    assert.ok(body.titles.every((title) => title.type === "movie"));
    assert.ok(
      body.titles.every((title) =>
        title.genres.includes("ficcao-cientifica"),
      ),
    );
  });

  it("busca um titulo pelo id", async () => {
    const response = await fetch(`${baseUrl}/api/titles/interestelar`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.title.id, "interestelar");
    assert.equal(body.title.title, "Interestelar");
  });

  it("responde 404 quando o titulo nao existe", async () => {
    const response = await fetch(`${baseUrl}/api/titles/titulo-inexistente`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.match(body.error, /nao encontrado/i);
  });

  it("cria recomendacoes a partir das preferencias", async () => {
    const response = await fetch(`${baseUrl}/api/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "movie",
        genre: "ficcao-cientifica",
        mood: "reflexivo",
        maxDuration: 120,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.recommendations.length, 3);
    assert.equal(body.recommendations[0].title, "A Chegada");
    assert.equal(body.recommendations[0].match, 100);
  });

  it("responde 400 quando as preferencias sao invalidas", async () => {
    const response = await fetch(`${baseUrl}/api/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "movie" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.ok(body.error);
  });

  it("responde 400 quando o JSON esta malformado", async () => {
    const response = await fetch(`${baseUrl}/api/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ type: movie }",
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "O corpo JSON da requisicao e invalido.");
  });
});
