import {
  InvalidPreferencesError,
  recommendTitles,
} from "../services/recommendation.service.js";

export async function createRecommendations(request, response, next) {
  try {
    const recommendations = await recommendTitles(request.body);
    response.json({ recommendations });
  } catch (error) {
    if (error instanceof InvalidPreferencesError) {
      response.status(400).json({ error: error.message });
      return;
    }

    next(error);
  }
}
