import {
  getAllTitles,
  getTitleById,
} from "../repositories/titles.repository.js";

const VALID_TYPES = new Set(["movie", "series"]);

export class InvalidTitleFiltersError extends Error {}
export class TitleNotFoundError extends Error {}

function normalizeOptionalFilter(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new InvalidTitleFiltersError(
      `O filtro ${fieldName} deve ser um texto valido.`,
    );
  }

  return value.trim().toLowerCase();
}

export async function findTitles(filters = {}, providedTitles) {
  const type = normalizeOptionalFilter(filters.type, "type");
  const genre = normalizeOptionalFilter(filters.genre, "genre");
  const mood = normalizeOptionalFilter(filters.mood, "mood");

  if (type && !VALID_TYPES.has(type)) {
    throw new InvalidTitleFiltersError(
      "O filtro type deve ser movie ou series.",
    );
  }

  const titles = providedTitles || (await getAllTitles());

  return titles.filter((title) => {
    const matchesType = !type || title.type === type;
    const matchesGenre = !genre || title.genres.includes(genre);
    const matchesMood = !mood || title.moods.includes(mood);

    return matchesType && matchesGenre && matchesMood;
  });
}

export async function findTitleById(id, providedTitles) {
  const title = providedTitles
    ? providedTitles.find((item) => item.id === id)
    : await getTitleById(id);

  if (!title) {
    throw new TitleNotFoundError(`Titulo com id "${id}" nao encontrado.`);
  }

  return title;
}
