import { getAllTitles } from "../repositories/titles.repository.js";

const VALID_TYPES = new Set(["movie", "series"]);

export class InvalidPreferencesError extends Error {}

function validatePreferences(preferences) {
  if (!preferences || typeof preferences !== "object") {
    throw new InvalidPreferencesError("Informe as preferencias do usuario.");
  }

  const { type, maxDuration } = preferences;
  const rawGenres = preferences.genres ?? preferences.genre;
  const rawMoods = preferences.moods ?? preferences.mood;

  if (!VALID_TYPES.has(type)) {
    throw new InvalidPreferencesError("Escolha movie ou series como tipo.");
  }

  const genres = typeof rawGenres === "string" ? [rawGenres] : rawGenres;

  if (
    !Array.isArray(genres) ||
    genres.length === 0 ||
    genres.some((genre) => typeof genre !== "string" || genre.trim() === "")
  ) {
    throw new InvalidPreferencesError("Escolha pelo menos um genero.");
  }

  const moods = typeof rawMoods === "string" ? [rawMoods] : rawMoods;

  if (
    !Array.isArray(moods) ||
    moods.length === 0 ||
    moods.some((mood) => typeof mood !== "string" || mood.trim() === "")
  ) {
    throw new InvalidPreferencesError("Escolha pelo menos um clima.");
  }

  const parsedDuration = Number(maxDuration);

  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    throw new InvalidPreferencesError("Informe uma duracao valida.");
  }

  return {
    type,
    genres: [...new Set(genres.map((genre) => genre.trim()))],
    moods: [...new Set(moods.map((mood) => mood.trim()))],
    maxDuration: parsedDuration,
  };
}

function scoreTitle(title, preferences) {
  let score = 0;
  const reasons = [];
  const matchedGenres = preferences.genres.filter((genre) =>
    title.genres.includes(genre),
  );
  const matchedMoods = preferences.moods.filter((mood) =>
    title.moods.includes(mood),
  );

  if (matchedGenres.length > 0) {
    score += Math.round((matchedGenres.length / preferences.genres.length) * 40);
    reasons.push(
      matchedGenres.length === preferences.genres.length
        ? "Combina com todos os generos escolhidos"
        : `Combina com ${matchedGenres.length} de ${preferences.genres.length} generos escolhidos`,
    );
  }

  if (matchedMoods.length > 0) {
    score += Math.round((matchedMoods.length / preferences.moods.length) * 35);
    reasons.push(
      matchedMoods.length === preferences.moods.length
        ? "Tem todos os climas que voce procura"
        : `Tem ${matchedMoods.length} de ${preferences.moods.length} climas escolhidos`,
    );
  }

  if (title.durationMinutes <= preferences.maxDuration) {
    score += 25;
    reasons.push("Cabe no seu tempo disponivel");
  }

  return {
    id: title.id,
    title: title.title,
    type: title.type,
    genres: title.genres,
    durationMinutes: title.durationMinutes,
    releaseYear: title.releaseYear,
    synopsis: title.synopsis,
    match: score,
    reasons:
      reasons.length > 0
        ? reasons
        : ["E uma alternativa para explorar algo diferente"],
  };
}

export async function recommendTitles(
  rawPreferences,
  providedTitles,
  limit = 3,
) {
  const preferences = validatePreferences(rawPreferences);
  const titles = providedTitles || (await getAllTitles());

  return titles
    .filter((title) => title.type === preferences.type)
    .map((title) => scoreTitle(title, preferences))
    .sort(
      (firstTitle, secondTitle) =>
        secondTitle.match - firstTitle.match ||
        secondTitle.releaseYear - firstTitle.releaseYear,
    )
    .slice(0, limit);
}
