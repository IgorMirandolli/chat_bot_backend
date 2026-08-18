import express from "express";
import recommendationsRouter from "./routes/recommendations.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }

    next();
  });

  app.get("/", (_request, response) => {
    response.json({
      application: "CineMatch API",
      documentation: "/api/health",
    });
  });

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", application: "CineMatch" });
  });

  app.use("/api/recommendations", recommendationsRouter);

  app.use("/api", (_request, response) => {
    response.status(404).json({ error: "Rota da API nao encontrada." });
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: "Ocorreu um erro interno no servidor." });
  });

  return app;
}
