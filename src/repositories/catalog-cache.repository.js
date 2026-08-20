import { getDatabase } from "../database/connection.js";

function parsePayload(payload) {
  return typeof payload === "string" ? JSON.parse(payload) : payload;
}

export async function getCachedCatalog(cacheKey) {
  const database = getDatabase();
  const row = await database("external_catalog_cache")
    .where("cache_key", cacheKey)
    .first("payload", "expires_at");

  if (!row) {
    return undefined;
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await database("external_catalog_cache")
      .where("cache_key", cacheKey)
      .delete();
    return undefined;
  }

  return parsePayload(row.payload);
}

export async function setCachedCatalog(
  cacheKey,
  payload,
  ttlMilliseconds,
) {
  const database = getDatabase();
  const now = new Date();
  const row = {
    cache_key: cacheKey,
    source: "tmdb",
    payload: JSON.stringify(payload),
    expires_at: new Date(now.getTime() + ttlMilliseconds),
    updated_at: now,
  };

  await database("external_catalog_cache")
    .insert({ ...row, created_at: now })
    .onConflict("cache_key")
    .merge(row);
}
