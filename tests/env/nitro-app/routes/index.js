import { MeiliSearch } from "meilisearch";

const meilisearch = new MeiliSearch({
  host: "http://localhost:7700",
  apiKey: "masterKey",
});

export default defineEventHandler(async () => {
  try {
    const health = await meilisearch.isHealthy();

    return { health };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Unexpected Error",
    });
  }
});
