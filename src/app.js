import express from "express";
import chatRouter from "./routes/chat.routes.js";
import healthRouter from "./routes/health.routes.js";
import recommendationsRouter from "./routes/recommendations.routes.js";
import titlesRouter from "./routes/titles.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

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

  app.use(express.json({ limit: "10kb" }));

  app.get("/", (_request, response) => {
    response.json({
      application: "CineMatch API",
      endpoints: {
        health: "GET /api/health",
        titles: "GET /api/titles",
        titleById: "GET /api/titles/:id",
        recommendations: "POST /api/recommendations",
        chat: "POST /api/chat",
      },
    });
  });

  app.use("/api/health", healthRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/titles", titlesRouter);
  app.use("/api/recommendations", recommendationsRouter);

  app.use("/api", (_request, response) => {
    response.status(404).json({ error: "Rota da API nao encontrada." });
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
      response.status(400).json({ error: "O corpo JSON da requisicao e invalido." });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "Ocorreu um erro interno no servidor." });
  });

  return app;
}
