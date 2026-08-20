import { getAllTitles } from "../repositories/titles.repository.js";
import {
  getTmdbRecommendationTitles,
  isTmdbConfigured,
} from "./tmdb.service.js";

function mergeCatalogs(externalTitles, localTitles) {
  const titlesByName = new Map();

  [...externalTitles, ...localTitles].forEach((title) => {
    const key = `${title.type}:${title.title.toLocaleLowerCase("pt-BR")}`;
    if (!titlesByName.has(key)) {
      titlesByName.set(key, title);
    }
  });

  return [...titlesByName.values()];
}

export async function getRecommendationCatalog(preferences, options = {}) {
  const localTitles = options.localTitles || (await getAllTitles());
  const configured = options.tmdbConfigured ?? isTmdbConfigured();

  if (!configured) {
    return localTitles;
  }

  try {
    const externalTitles = await (
      options.getExternalTitles || getTmdbRecommendationTitles
    )(preferences);
    return mergeCatalogs(externalTitles, localTitles);
  } catch (error) {
    const logger = options.logger || console;
    logger.warn(`TMDB indisponivel. Usando catalogo local: ${error.message}`);
    return localTitles;
  }
}
