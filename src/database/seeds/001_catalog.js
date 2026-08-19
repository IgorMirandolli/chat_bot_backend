const titles = [
  {
    slug: "interestelar",
    title: "Interestelar",
    type: "movie",
    genres: ["ficcao-cientifica", "drama"],
    moods: ["emocionante", "reflexivo"],
    durationMinutes: 169,
    releaseYear: 2014,
    ageRating: "10",
    synopsis:
      "Uma equipe de exploradores viaja pelo espaco em busca de um novo lar para a humanidade.",
  },
  {
    slug: "a-chegada",
    title: "A Chegada",
    type: "movie",
    genres: ["ficcao-cientifica", "drama"],
    moods: ["tenso", "reflexivo"],
    durationMinutes: 116,
    releaseYear: 2016,
    ageRating: "10",
    synopsis:
      "Uma linguista tenta estabelecer comunicacao com visitantes de outro planeta.",
  },
  {
    slug: "entre-facas-e-segredos",
    title: "Entre Facas e Segredos",
    type: "movie",
    genres: ["misterio", "comedia"],
    moods: ["divertido", "tenso"],
    durationMinutes: 130,
    releaseYear: 2019,
    ageRating: "14",
    synopsis:
      "Um detetive investiga uma familia cheia de segredos apos uma morte misteriosa.",
  },
  {
    slug: "homem-aranha-aranhaverso",
    title: "Homem-Aranha no Aranhaverso",
    type: "movie",
    genres: ["acao", "animacao", "aventura"],
    moods: ["divertido", "emocionante"],
    durationMinutes: 117,
    releaseYear: 2018,
    ageRating: "10",
    synopsis:
      "Miles Morales descobre novas dimensoes e aprende o que significa ser um heroi.",
  },
  {
    slug: "parasita",
    title: "Parasita",
    type: "movie",
    genres: ["suspense", "drama"],
    moods: ["tenso", "reflexivo"],
    durationMinutes: 132,
    releaseYear: 2019,
    ageRating: "16",
    synopsis:
      "Duas familias de realidades opostas se aproximam de maneira inesperada.",
  },
  {
    slug: "servico-de-entregas-da-kiki",
    title: "O Servico de Entregas da Kiki",
    type: "movie",
    genres: ["animacao", "fantasia"],
    moods: ["relaxante", "divertido"],
    durationMinutes: 103,
    releaseYear: 1989,
    ageRating: "Livre",
    synopsis:
      "Uma jovem bruxa inicia sua vida independente em uma cidade a beira-mar.",
  },
  {
    slug: "dark",
    title: "Dark",
    type: "series",
    genres: ["ficcao-cientifica", "misterio"],
    moods: ["tenso", "reflexivo"],
    durationMinutes: 55,
    releaseYear: 2017,
    ageRating: "16",
    synopsis:
      "O desaparecimento de uma crianca revela segredos que atravessam varias geracoes.",
  },
  {
    slug: "stranger-things",
    title: "Stranger Things",
    type: "series",
    genres: ["acao", "ficcao-cientifica", "aventura"],
    moods: ["tenso", "emocionante"],
    durationMinutes: 50,
    releaseYear: 2016,
    ageRating: "14",
    synopsis:
      "Um grupo de amigos enfrenta acontecimentos sobrenaturais em uma pequena cidade.",
  },
  {
    slug: "the-good-place",
    title: "The Good Place",
    type: "series",
    genres: ["comedia", "fantasia"],
    moods: ["divertido", "reflexivo"],
    durationMinutes: 22,
    releaseYear: 2016,
    ageRating: "12",
    synopsis:
      "Uma mulher tenta se tornar uma pessoa melhor em um lugar muito peculiar.",
  },
  {
    slug: "brooklyn-nine-nine",
    title: "Brooklyn Nine-Nine",
    type: "series",
    genres: ["comedia"],
    moods: ["divertido", "relaxante"],
    durationMinutes: 22,
    releaseYear: 2013,
    ageRating: "12",
    synopsis:
      "Detetives resolvem casos enquanto lidam com a rotina divertida de uma delegacia.",
  },
  {
    slug: "arcane",
    title: "Arcane",
    type: "series",
    genres: ["acao", "animacao", "fantasia"],
    moods: ["emocionante", "tenso"],
    durationMinutes: 42,
    releaseYear: 2021,
    ageRating: "14",
    synopsis:
      "Duas irmas ficam em lados opostos de um conflito entre cidades rivais.",
  },
  {
    slug: "anne-with-an-e",
    title: "Anne with an E",
    type: "series",
    genres: ["drama"],
    moods: ["emocionante", "relaxante"],
    durationMinutes: 45,
    releaseYear: 2017,
    ageRating: "12",
    synopsis:
      "Uma jovem imaginativa transforma a vida de uma pequena comunidade.",
  },
];

const genreNames = {
  acao: "Acao",
  animacao: "Animacao",
  aventura: "Aventura",
  comedia: "Comedia",
  drama: "Drama",
  fantasia: "Fantasia",
  "ficcao-cientifica": "Ficcao cientifica",
  misterio: "Misterio",
  suspense: "Suspense",
};

const moodNames = {
  divertido: "Divertido",
  emocionante: "Emocionante",
  reflexivo: "Reflexivo",
  relaxante: "Relaxante",
  tenso: "Tenso",
};

function uniqueValues(field) {
  return [...new Set(titles.flatMap((title) => title[field]))];
}

export async function seed(knex) {
  const genres = uniqueValues("genres").map((slug) => ({
    slug,
    name: genreNames[slug],
  }));
  const moods = uniqueValues("moods").map((slug) => ({
    slug,
    name: moodNames[slug],
  }));

  await knex("genres").insert(genres).onConflict("slug").merge(["name"]);
  await knex("moods").insert(moods).onConflict("slug").merge(["name"]);

  const titleRows = titles.map((title) => ({
    slug: title.slug,
    title: title.title,
    type: title.type,
    synopsis: title.synopsis,
    duration_minutes: title.durationMinutes,
    release_year: title.releaseYear,
    age_rating: title.ageRating,
  }));

  await knex("titles")
    .insert(titleRows)
    .onConflict("slug")
    .merge([
      "title",
      "type",
      "synopsis",
      "duration_minutes",
      "release_year",
      "age_rating",
    ]);

  const storedTitles = await knex("titles")
    .whereIn(
      "slug",
      titles.map((title) => title.slug),
    )
    .select("id", "slug");
  const storedGenres = await knex("genres").select("id", "slug");
  const storedMoods = await knex("moods").select("id", "slug");

  const titleIds = new Map(
    storedTitles.map((title) => [title.slug, title.id]),
  );
  const genreIds = new Map(
    storedGenres.map((genre) => [genre.slug, genre.id]),
  );
  const moodIds = new Map(storedMoods.map((mood) => [mood.slug, mood.id]));

  const seededTitleIds = [...titleIds.values()];

  await knex("title_genres").whereIn("title_id", seededTitleIds).delete();
  await knex("title_moods").whereIn("title_id", seededTitleIds).delete();

  const titleGenres = titles.flatMap((title) =>
    title.genres.map((genre) => ({
      title_id: titleIds.get(title.slug),
      genre_id: genreIds.get(genre),
    })),
  );
  const titleMoods = titles.flatMap((title) =>
    title.moods.map((mood) => ({
      title_id: titleIds.get(title.slug),
      mood_id: moodIds.get(mood),
    })),
  );

  await knex("title_genres").insert(titleGenres);
  await knex("title_moods").insert(titleMoods);
}
