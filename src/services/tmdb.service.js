import {
  getCachedCatalog,
  setCachedCatalog,
} from "../repositories/catalog-cache.repository.js";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const DEFAULT_CACHE_TTL_MILLISECONDS = 6 * 60 * 60 * 1000;
const DEFAULT_CANDIDATE_LIMIT = 12;

const GENRE_IDS = {
  movie: {
    acao: 28,
    aventura: 12,
    animacao: 16,
    comedia: 35,
    drama: 18,
    fantasia: 14,
    "ficcao-cientifica": 878,
    misterio: 9648,
    suspense: 53,
  },
  series: {
    acao: 10759,
    aventura: 10759,
    animacao: 16,
    comedia: 35,
    drama: 18,
    fantasia: 10765,
    "ficcao-cientifica": 10765,
    misterio: 9648,
    suspense: 53,
  },
};

const MOODS_BY_GENRE = {
  acao: ["emocionante", "tenso"],
  aventura: ["emocionante"],
  animacao: ["divertido", "relaxante"],
  comedia: ["divertido", "relaxante"],
  drama: ["emocionante", "reflexivo"],
  fantasia: ["emocionante", "relaxante"],
  "ficcao-cientifica": ["emocionante", "reflexivo"],
  misterio: ["reflexivo", "tenso"],
  suspense: ["tenso"],
};

export class TmdbConfigurationError extends Error {}
export class TmdbRequestError extends Error {}

export function isTmdbConfigured(environment = process.env) {
  return Boolean(environment.TMDB_ACCESS_TOKEN?.trim());
}

function getPositiveInteger(value, fallback, maximum) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return Math.min(parsedValue, maximum);
}

function getCacheTtlMilliseconds(environment) {
  const hours = Number(environment.TMDB_CACHE_TTL_HOURS);
  return Number.isFinite(hours) && hours > 0
    ? hours * 60 * 60 * 1000
    : DEFAULT_CACHE_TTL_MILLISECONDS;
}

function getGenreIds(type, genres) {
  const mapping = GENRE_IDS[type];
  return [...new Set(genres.map((genre) => mapping[genre]).filter(Boolean))];
}

function getLocalGenres(type, tmdbGenreIds) {
  const selectedIds = new Set(tmdbGenreIds);
  return Object.entries(GENRE_IDS[type])
    .filter(([, id]) => selectedIds.has(id))
    .map(([genre]) => genre);
}

function inferMoods(genres) {
  return [
    ...new Set(genres.flatMap((genre) => MOODS_BY_GENRE[genre] || [])),
  ];
}

function buildDiscoverUrl(preferences, environment) {
  const resource = preferences.type === "movie" ? "movie" : "tv";
  const url = new URL(`${TMDB_API_URL}/discover/${resource}`);
  const genreIds = getGenreIds(preferences.type, preferences.genres);

  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", environment.TMDB_LANGUAGE || "pt-BR");
  url.searchParams.set("page", "1");
  url.searchParams.set("sort_by", "popularity.desc");
  url.searchParams.set("vote_count.gte", "100");
  url.searchParams.set("with_runtime.lte", String(preferences.maxDuration));

  if (genreIds.length > 0) {
    url.searchParams.set("with_genres", genreIds.join(","));
  }

  if (preferences.type === "movie" && environment.TMDB_REGION) {
    url.searchParams.set("region", environment.TMDB_REGION);
  }

  return url;
}

function buildCacheKey(preferences, environment) {
  const language = environment.TMDB_LANGUAGE || "pt-BR";
  const region = environment.TMDB_REGION || "BR";
  const genres = [...preferences.genres].sort().join("+");
  return `tmdb:${language}:${region}:${preferences.type}:${genres}:${preferences.maxDuration}`;
}

async function requestJson(url, fetchImplementation, accessToken) {
  const response = await fetchImplementation(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new TmdbRequestError(
      `O TMDB respondeu com status ${response.status}.`,
    );
  }

  return response.json();
}

function getDuration(type, details) {
  if (type === "movie") {
    return Number(details.runtime);
  }

  const episodeDuration = details.episode_run_time?.find(
    (duration) => Number(duration) > 0,
  );
  return Number(episodeDuration || details.last_episode_to_air?.runtime);
}

function getReleaseYear(type, details, discoveredTitle) {
  const date = type === "movie"
    ? details.release_date || discoveredTitle.release_date
    : details.first_air_date || discoveredTitle.first_air_date;
  const year = Number(String(date || "").slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : new Date().getFullYear();
}

function normalizeTmdbTitle(type, discoveredTitle, details) {
  const tmdbGenreIds = details.genres?.map((genre) => genre.id) ||
    discoveredTitle.genre_ids || [];
  const genres = getLocalGenres(type, tmdbGenreIds);
  const durationMinutes = getDuration(type, details);

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return undefined;
  }

  const title = type === "movie"
    ? details.title || discoveredTitle.title
    : details.name || discoveredTitle.name;
  const posterPath = details.poster_path || discoveredTitle.poster_path;

  return {
    id: `tmdb-${type}-${details.id}`,
    externalId: Number(details.id),
    source: "tmdb",
    title,
    type,
    genres,
    moods: inferMoods(genres),
    durationMinutes,
    releaseYear: getReleaseYear(type, details, discoveredTitle),
    synopsis:
      details.overview ||
      discoveredTitle.overview ||
      "Sinopse ainda nao disponivel em portugues.",
    posterUrl: posterPath ? `${TMDB_IMAGE_URL}${posterPath}` : undefined,
    voteAverage: Number(details.vote_average || discoveredTitle.vote_average || 0),
    popularity: Number(details.popularity || discoveredTitle.popularity || 0),
  };
}

async function readCache(cacheKey, readCachedCatalog) {
  try {
    return await readCachedCatalog(cacheKey);
  } catch {
    return undefined;
  }
}

async function writeCache(
  cacheKey,
  titles,
  ttlMilliseconds,
  writeCachedCatalog,
) {
  try {
    await writeCachedCatalog(cacheKey, titles, ttlMilliseconds);
  } catch {
    // Recommendations can still be returned when cache persistence fails.
  }
}

export async function getTmdbRecommendationTitles(preferences, options = {}) {
  const environment = options.environment || process.env;
  const accessToken = options.accessToken ?? environment.TMDB_ACCESS_TOKEN?.trim();

  if (!accessToken) {
    throw new TmdbConfigurationError("Configure TMDB_ACCESS_TOKEN no backend.");
  }

  const fetchImplementation = options.fetchImplementation || fetch;
  const readCachedCatalog = options.readCachedCatalog || getCachedCatalog;
  const writeCachedCatalog = options.writeCachedCatalog || setCachedCatalog;
  const candidateLimit = getPositiveInteger(
    options.candidateLimit ?? environment.TMDB_CANDIDATE_LIMIT,
    DEFAULT_CANDIDATE_LIMIT,
    20,
  );
  const cacheKey = buildCacheKey(preferences, environment);
  const cachedTitles = await readCache(cacheKey, readCachedCatalog);

  if (Array.isArray(cachedTitles) && cachedTitles.length > 0) {
    return cachedTitles;
  }

  const discoverUrl = buildDiscoverUrl(preferences, environment);
  const discovered = await requestJson(
    discoverUrl,
    fetchImplementation,
    accessToken,
  );
  const resource = preferences.type === "movie" ? "movie" : "tv";
  const candidates = Array.isArray(discovered.results)
    ? discovered.results.slice(0, candidateLimit)
    : [];

  const titles = (
    await Promise.all(
      candidates.map(async (candidate) => {
        try {
          const detailsUrl = new URL(`${TMDB_API_URL}/${resource}/${candidate.id}`);
          detailsUrl.searchParams.set(
            "language",
            environment.TMDB_LANGUAGE || "pt-BR",
          );
          const details = await requestJson(
            detailsUrl,
            fetchImplementation,
            accessToken,
          );
          return normalizeTmdbTitle(preferences.type, candidate, details);
        } catch {
          return undefined;
        }
      }),
    )
  ).filter(Boolean);

  if (titles.length === 0) {
    throw new TmdbRequestError(
      "O TMDB nao retornou titulos completos para estas preferencias.",
    );
  }

  await writeCache(
    cacheKey,
    titles,
    getCacheTtlMilliseconds(environment),
    writeCachedCatalog,
  );

  return titles;
}
