import { getAllTitles } from "../repositories/titles.repository.js";

const VALID_TYPES = new Set(["movie", "series"]);

export class InvalidPreferencesError extends Error {}

function validatePreferences(preferences) {
  if (!preferences || typeof preferences !== "object") {
    throw new InvalidPreferencesError("Informe as preferencias do usuario.");
  }

  const { type, genre, mood, maxDuration } = preferences;

  if (!VALID_TYPES.has(type)) {
    throw new InvalidPreferencesError("Escolha movie ou series como tipo.");
  }

  if (typeof genre !== "string" || genre.trim() === "") {
    throw new InvalidPreferencesError("Escolha um genero.");
  }

  if (typeof mood !== "string" || mood.trim() === "") {
    throw new InvalidPreferencesError("Escolha um clima.");
  }

  const parsedDuration = Number(maxDuration);

  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    throw new InvalidPreferencesError("Informe uma duracao valida.");
  }

  return {
    type,
    genre: genre.trim(),
    mood: mood.trim(),
    maxDuration: parsedDuration,
  };
}

function scoreTitle(title, preferences) {
  let score = 0;
  const reasons = [];

  if (title.genres.includes(preferences.genre)) {
    score += 40;
    reasons.push("Combina com o genero escolhido");
  }

  if (title.moods.includes(preferences.mood)) {
    score += 35;
    reasons.push("Tem o clima que voce procura");
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

export function recommendTitles(
  rawPreferences,
  titles = getAllTitles(),
  limit = 3,
) {
  const preferences = validatePreferences(rawPreferences);

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
