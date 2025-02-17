import type { NonNullableDeepRecordValues } from "./shared.js";

/** {@link https://www.meilisearch.com/docs/reference/api/settings#proximity-precision} */
export type ProximityPrecision = "byWord" | "byAttribute";

/** @see `minWordSizeForTypos` at {@link https://www.meilisearch.com/docs/reference/api/settings#typo-tolerance} */
export type MinWordSizeForTypos = {
  oneTypo?: number | null;
  twoTypos?: number | null;
};

/** {@link https://www.meilisearch.com/docs/reference/api/settings#typo-tolerance} */
export type TypoTolerance = {
  enabled?: boolean | null;
  minWordSizeForTypos?: MinWordSizeForTypos | null;
  disableOnWords?: string[] | null;
  disableOnAttributes?: string[] | null;
};

/** @see `sortFacetValuesBy` at {@link https://www.meilisearch.com/docs/reference/api/settings#faceting} */
export type FacetOrder = "alpha" | "count";

/** {@link https://www.meilisearch.com/docs/reference/api/settings#faceting} */
export type Faceting = {
  maxValuesPerFacet?: number | null;
  sortFacetValuesBy?: Record<string, FacetOrder> | null;
};

/** {@link https://www.meilisearch.com/docs/reference/api/settings#pagination} */
export type PaginationSettings = { maxTotalHits?: number | null };

/** @see `distribution` at {@link https://www.meilisearch.com/docs/reference/api/settings#embedders-experimental} */
export type Distribution = {
  mean: number;
  sigma: number;
};

/** @see `source` at {@link https://www.meilisearch.com/docs/reference/api/settings#embedders-experimental} */
export type EmbedderSource =
  | "openAi"
  | "huggingFace"
  | "ollama"
  | "userProvided"
  | "rest";

/** {@link https://www.meilisearch.com/docs/reference/api/settings#embedders-experimental} */
export type EmbeddingSettings = {
  source?: EmbedderSource | null;
  model?: string | null;
  revision?: string | null;
  apiKey?: string | null;
  dimensions?: number | null;
  binaryQuantized?: boolean | null;
  documentTemplate?: string | null;
  documentTemplateMaxBytes?: number | null;
  url?: string | null;
  request?: unknown;
  response?: unknown;
  headers?: Record<string, string> | null;
  distribution?: Distribution | null;
};

/** {@link https://www.meilisearch.com/docs/reference/api/settings#localized-attributes} */
export type LocalizedAttribute = {
  attributePatterns: string[] | null;
  locales: string[] | null;
};

/** {@link https://www.meilisearch.com/docs/reference/api/settings#prefix-search} */
export type PrefixSearch = "indexingTime" | "disabled";

/** A version of {@link Settings} that can be used to update the settings. */
export type UpdatableSettings = {
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#displayed-attributes} */
  displayedAttributes?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#searchable-attributes} */
  searchableAttributes?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#filterable-attributes} */
  filterableAttributes?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#sortable-attributes} */
  sortableAttributes?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#ranking-rules} */
  rankingRules?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#stop-words} */
  stopWords?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#non-separator-tokens} */
  nonSeparatorTokens?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#separator-tokens} */
  separatorTokens?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#dictionary} */
  dictionary?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#synonyms} */
  synonyms?: Record<string, string[]> | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#distinct-attribute} */
  distinctAttribute?: string | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#proximity-precision} */
  proximityPrecision?: ProximityPrecision | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#typo-tolerance} */
  typoTolerance?: TypoTolerance | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#faceting} */
  faceting?: Faceting | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#pagination} */
  pagination?: PaginationSettings | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#embedders-experimental} */
  embedders?: Record<string, EmbeddingSettings> | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#search-cutoff} */
  searchCutoffMs?: number | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#localized-attributes} */
  localizedAttributes?: LocalizedAttribute[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#facet-search} */
  facetSearch?: boolean | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#prefix-search} */
  prefixSearch?: PrefixSearch | null;
};

/**
 * A version of {@link UpdatableSettings}, the first layer of properties of which
 * is used to update or get individual settings.
 */
export type IndividualSettings = Required<UpdatableSettings>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/settings#body}
 *
 * @see `meilisearch_types::settings::Settings` at {@link https://github.com/meilisearch/meilisearch}
 */
export type Settings = NonNullableDeepRecordValues<UpdatableSettings>;
