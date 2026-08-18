import { getAllTitles } from "../repositories/titles.repository.js";
import {
  InvalidPreferencesError,
  recommendTitles,
} from "../services/recommendation.service.js";

export function createRecommendations(request, response, next) {
  try {
    const recommendations = recommendTitles(request.body, getAllTitles());
    response.json({ recommendations });
  } catch (error) {
    if (error instanceof InvalidPreferencesError) {
      response.status(400).json({ error: error.message });
      return;
    }

    next(error);
  }
}

