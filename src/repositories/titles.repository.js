import { getDatabase } from "../database/connection.js";

function groupSlugsByTitle(rows) {
  return rows.reduce((groups, row) => {
    const slugs = groups.get(row.titleId) || [];
    slugs.push(row.slug);
    groups.set(row.titleId, slugs);
    return groups;
  }, new Map());
}

async function addRelationships(titleRows) {
  if (titleRows.length === 0) {
    return [];
  }

  const database = getDatabase();
  const titleIds = titleRows.map((title) => title.id);
  const [genreRows, moodRows] = await Promise.all([
    database("title_genres as titleGenre")
      .join("genres as genre", "genre.id", "titleGenre.genre_id")
      .whereIn("titleGenre.title_id", titleIds)
      .orderBy("genre.name")
      .select("titleGenre.title_id as titleId", "genre.slug"),
    database("title_moods as titleMood")
      .join("moods as mood", "mood.id", "titleMood.mood_id")
      .whereIn("titleMood.title_id", titleIds)
      .orderBy("mood.name")
      .select("titleMood.title_id as titleId", "mood.slug"),
  ]);

  const genresByTitle = groupSlugsByTitle(genreRows);
  const moodsByTitle = groupSlugsByTitle(moodRows);

  return titleRows.map((title) => ({
    id: title.slug,
    title: title.title,
    type: title.type,
    genres: genresByTitle.get(title.id) || [],
    moods: moodsByTitle.get(title.id) || [],
    durationMinutes: Number(title.duration_minutes),
    releaseYear: Number(title.release_year),
    ageRating: title.age_rating,
    synopsis: title.synopsis,
  }));
}

export async function getAllTitles() {
  const database = getDatabase();
  const titleRows = await database("titles")
    .select(
      "id",
      "slug",
      "title",
      "type",
      "synopsis",
      "duration_minutes",
      "release_year",
      "age_rating",
    )
    .orderBy("title");

  return addRelationships(titleRows);
}

export async function getTitleById(id) {
  const database = getDatabase();
  const title = await database("titles")
    .where("slug", id)
    .select(
      "id",
      "slug",
      "title",
      "type",
      "synopsis",
      "duration_minutes",
      "release_year",
      "age_rating",
    )
    .first();

  if (!title) {
    return undefined;
  }

  const [result] = await addRelationships([title]);
  return result;
}
