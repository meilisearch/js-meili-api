export * from "./types/index.js";
export * from "./errors/index.js";
export * from "./indexes.js";
import { MeiliSearch } from "./meilisearch.js";

/**
 * Default export of {@link MeiliSearch}.
 *
 * @deprecated The default export will be removed in a future version.
 *   {@link https://github.com/meilisearch/meilisearch-js/issues/1789 | Issue}.
 */
const defaultExport = MeiliSearch;

export { MeiliSearch, MeiliSearch as Meilisearch };
export default defaultExport;
