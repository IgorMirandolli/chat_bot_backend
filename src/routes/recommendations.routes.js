import { Router } from "express";
import { createRecommendations } from "../controllers/recommendations.controller.js";

const recommendationsRouter = Router();

recommendationsRouter.post("/", createRecommendations);

export default recommendationsRouter;

