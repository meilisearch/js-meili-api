/*
 * Bundle: MeiliSearch / Indexes
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

import { MeiliSearchError } from "./errors/index.js";
import type {
  Config,
  SearchResponse,
  SearchParams,
  Filter,
  SearchRequestGET,
  IndexObject,
  IndexOptions,
  IndexStats,
  DocumentsQuery,
  DocumentQuery,
  DocumentOptions,
  Settings,
  Synonyms,
  StopWords,
  RankingRules,
  DistinctAttribute,
  FilterableAttributes,
  SortableAttributes,
  SearchableAttributes,
  DisplayedAttributes,
  TypoTolerance,
  PaginationSettings,
  Faceting,
  ResourceResults,
  RawDocumentAdditionOptions,
  ContentType,
  DocumentsIds,
  DocumentsDeletionQuery,
  SearchForFacetValuesParams,
  SearchForFacetValuesResponse,
  SeparatorTokens,
  NonSeparatorTokens,
  Dictionary,
  ProximityPrecision,
  Embedders,
  SearchCutoffMs,
  SearchSimilarDocumentsParams,
  LocalizedAttributes,
  UpdateDocumentsByFunctionOptions,
  PrefixSearch,
  EnqueuedTaskPromise,
} from "./types/index.js";
import { removeUndefinedFromObject } from "./utils.js";
import { HttpRequests } from "./http-requests.js";
import {
  getHttpRequestsWithEnqueuedTaskPromise,
  TaskClient,
  type HttpRequestsWithEnqueuedTaskPromise,
} from "./task.js";

export class Index<T extends Record<string, any> = Record<string, any>> {
  uid: string;
  primaryKey: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  httpRequest: HttpRequests;
  tasks: TaskClient;
  readonly #httpRequestsWithTask: HttpRequestsWithEnqueuedTaskPromise;

  /**
   * @param config - Request configuration options
   * @param uid - UID of the index
   * @param primaryKey - Primary Key of the index
   */
  constructor(config: Config, uid: string, primaryKey?: string) {
    this.uid = uid;
    this.primaryKey = primaryKey;
    this.httpRequest = new HttpRequests(config);
    this.tasks = new TaskClient(this.httpRequest, config.defaultWaitOptions);
    this.#httpRequestsWithTask = getHttpRequestsWithEnqueuedTaskPromise(
      this.httpRequest,
      this.tasks,
    );
  }

  ///
  /// SEARCH
  ///

  /**
   * Search for documents into an index
   *
   * @param query - Query string
   * @param options - Search options
   * @param config - Additional request configuration options
   * @returns Promise containing the search response
   */
  async search<
    D extends Record<string, any> = T,
    S extends SearchParams = SearchParams,
  >(
    query?: string | null,
    options?: S,
    config?: Partial<Request>,
  ): Promise<SearchResponse<D, S>> {
    const url = `indexes/${this.uid}/search`;

    return await this.httpRequest.post(
      url,
      removeUndefinedFromObject({ q: query, ...options }),
      undefined,
      config,
    );
  }

  /**
   * Search for documents into an index using the GET method
   *
   * @param query - Query string
   * @param options - Search options
   * @param config - Additional request configuration options
   * @returns Promise containing the search response
   */
  async searchGet<
    D extends Record<string, any> = T,
    S extends SearchParams = SearchParams,
  >(
    query?: string | null,
    options?: S,
    config?: Partial<Request>,
  ): Promise<SearchResponse<D, S>> {
    const url = `indexes/${this.uid}/search`;

    const parseFilter = (filter?: Filter): string | undefined => {
      if (typeof filter === "string") return filter;
      else if (Array.isArray(filter))
        throw new MeiliSearchError(
          "The filter query parameter should be in string format when using searchGet",
        );
      else return undefined;
    };

    const getParams: SearchRequestGET = {
      q: query,
      ...options,
      filter: parseFilter(options?.filter),
      sort: options?.sort?.join(","),
      facets: options?.facets?.join(","),
      attributesToRetrieve: options?.attributesToRetrieve?.join(","),
      attributesToCrop: options?.attributesToCrop?.join(","),
      attributesToHighlight: options?.attributesToHighlight?.join(","),
      vector: options?.vector?.join(","),
      attributesToSearchOn: options?.attributesToSearchOn?.join(","),
    };

    return await this.httpRequest.get<SearchResponse<D, S>>(
      url,
      removeUndefinedFromObject(getParams),
      config,
    );
  }

  /**
   * Search for facet values
   *
   * @param params - Parameters used to search on the facets
   * @param config - Additional request configuration options
   * @returns Promise containing the search response
   */
  async searchForFacetValues(
    params: SearchForFacetValuesParams,
    config?: Partial<Request>,
  ): Promise<SearchForFacetValuesResponse> {
    const url = `indexes/${this.uid}/facet-search`;

    return await this.httpRequest.post(
      url,
      removeUndefinedFromObject(params),
      undefined,
      config,
    );
  }

  /**
   * Search for similar documents
   *
   * @param params - Parameters used to search for similar documents
   * @returns Promise containing the search response
   */
  async searchSimilarDocuments<
    D extends Record<string, any> = T,
    S extends SearchParams = SearchParams,
  >(params: SearchSimilarDocumentsParams): Promise<SearchResponse<D, S>> {
    const url = `indexes/${this.uid}/similar`;

    return await this.httpRequest.post(
      url,
      removeUndefinedFromObject(params),
      undefined,
    );
  }

  ///
  /// INDEX
  ///

  /**
   * Get index information.
   *
   * @returns Promise containing index information
   */
  async getRawInfo(): Promise<IndexObject> {
    const url = `indexes/${this.uid}`;
    const res = await this.httpRequest.get<IndexObject>(url);
    this.primaryKey = res.primaryKey;
    this.updatedAt = new Date(res.updatedAt);
    this.createdAt = new Date(res.createdAt);
    return res;
  }

  /**
   * Fetch and update Index information.
   *
   * @returns Promise to the current Index object with updated information
   */
  async fetchInfo(): Promise<this> {
    await this.getRawInfo();
    return this;
  }

  /**
   * Get Primary Key.
   *
   * @returns Promise containing the Primary Key of the index
   */
  async fetchPrimaryKey(): Promise<string | undefined> {
    this.primaryKey = (await this.getRawInfo()).primaryKey;
    return this.primaryKey;
  }

  /**
   * Create an index.
   *
   * @param uid - Unique identifier of the Index
   * @param options - Index options
   * @param config - Request configuration options
   * @returns Newly created Index object
   */
  static create(
    uid: string,
    options: IndexOptions = {},
    config: Config,
  ): EnqueuedTaskPromise {
    const url = `indexes`;
    const httpRequests = new HttpRequests(config);
    return getHttpRequestsWithEnqueuedTaskPromise(
      httpRequests,
      new TaskClient(httpRequests),
    ).post(url, {
      ...options,
      uid,
    });
  }

  /**
   * Update an index.
   *
   * @param data - Data to update
   * @returns Promise to the current Index object with updated information
   */
  update(data?: IndexOptions): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}`;
    return this.#httpRequestsWithTask.patch(url, data);
  }

  /**
   * Delete an index.
   *
   * @returns Promise which resolves when index is deleted successfully
   */
  delete(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// STATS
  ///

  /**
   * Get stats of an index
   *
   * @returns Promise containing object with stats of the index
   */
  async getStats(): Promise<IndexStats> {
    const url = `indexes/${this.uid}/stats`;
    return await this.httpRequest.get<IndexStats>(url);
  }

  ///
  /// DOCUMENTS
  ///

  /**
   * Get documents of an index.
   *
   * @param parameters - Parameters to browse the documents. Parameters can
   *   contain the `filter` field only available in Meilisearch v1.2 and newer
   * @returns Promise containing the returned documents
   */
  async getDocuments<D extends Record<string, any> = T>(
    parameters: DocumentsQuery<D> = {},
  ): Promise<ResourceResults<D[]>> {
    parameters = removeUndefinedFromObject(parameters);

    // In case `filter` is provided, use `POST /documents/fetch`
    if (parameters.filter !== undefined) {
      const url = `indexes/${this.uid}/documents/fetch`;

      return await this.httpRequest.post<
        DocumentsQuery,
        Promise<ResourceResults<D[]>>
      >(url, parameters);
      // Else use `GET /documents` method
    } else {
      const url = `indexes/${this.uid}/documents`;

      // Transform fields to query parameter string format
      const fields = Array.isArray(parameters?.fields)
        ? { fields: parameters?.fields?.join(",") }
        : {};

      return await this.httpRequest.get<Promise<ResourceResults<D[]>>>(url, {
        ...parameters,
        ...fields,
      });
    }
  }

  /**
   * Get one document
   *
   * @param documentId - Document ID
   * @param parameters - Parameters applied on a document
   * @returns Promise containing Document response
   */
  async getDocument<D extends Record<string, any> = T>(
    documentId: string | number,
    parameters?: DocumentQuery<T>,
  ): Promise<D> {
    const url = `indexes/${this.uid}/documents/${documentId}`;

    const fields = (() => {
      if (Array.isArray(parameters?.fields)) {
        return parameters?.fields?.join(",");
      }
      return undefined;
    })();

    return await this.httpRequest.get<D>(
      url,
      removeUndefinedFromObject({
        ...parameters,
        fields,
      }),
    );
  }

  /**
   * Add or replace multiples documents to an index
   *
   * @param documents - Array of Document objects to add/replace
   * @param options - Options on document addition
   * @returns Promise containing an EnqueuedTask
   */
  addDocuments(documents: T[], options?: DocumentOptions): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/documents`;
    return this.#httpRequestsWithTask.post(url, documents, options);
  }

  /**
   * Add or replace multiples documents in a string format to an index. It only
   * supports csv, ndjson and json formats.
   *
   * @param documents - Documents provided in a string to add/replace
   * @param contentType - Content type of your document:
   *   'text/csv'|'application/x-ndjson'|'application/json'
   * @param options - Options on document addition
   * @returns Promise containing an EnqueuedTask
   */
  addDocumentsFromString(
    documents: string,
    contentType: ContentType,
    queryParams?: RawDocumentAdditionOptions,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/documents`;

    return this.#httpRequestsWithTask.post(url, documents, queryParams, {
      headers: {
        "Content-Type": contentType,
      },
    });
  }

  /**
   * Add or replace multiples documents to an index in batches
   *
   * @param documents - Array of Document objects to add/replace
   * @param batchSize - Size of the batch
   * @param options - Options on document addition
   * @returns Promise containing array of enqueued task objects for each batch
   */
  addDocumentsInBatches(
    documents: T[],
    batchSize = 1000,
    options?: DocumentOptions,
  ): EnqueuedTaskPromise[] {
    const updates: EnqueuedTaskPromise[] = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        this.addDocuments(documents.slice(i, i + batchSize), options),
      );
    }

    return updates;
  }

  /**
   * Add or update multiples documents to an index
   *
   * @param documents - Array of Document objects to add/update
   * @param options - Options on document update
   * @returns Promise containing an EnqueuedTask
   */
  updateDocuments(
    documents: Array<Partial<T>>,
    options?: DocumentOptions,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/documents`;
    return this.#httpRequestsWithTask.put(url, documents, options);
  }

  /**
   * Add or update multiples documents to an index in batches
   *
   * @param documents - Array of Document objects to add/update
   * @param batchSize - Size of the batch
   * @param options - Options on document update
   * @returns Promise containing array of enqueued task objects for each batch
   */
  updateDocumentsInBatches(
    documents: Array<Partial<T>>,
    batchSize = 1000,
    options?: DocumentOptions,
  ): EnqueuedTaskPromise[] {
    const updates: EnqueuedTaskPromise[] = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        this.updateDocuments(documents.slice(i, i + batchSize), options),
      );
    }

    return updates;
  }

  /**
   * Add or update multiples documents in a string format to an index. It only
   * supports csv, ndjson and json formats.
   *
   * @param documents - Documents provided in a string to add/update
   * @param contentType - Content type of your document:
   *   'text/csv'|'application/x-ndjson'|'application/json'
   * @param queryParams - Options on raw document addition
   * @returns Promise containing an EnqueuedTask
   */
  updateDocumentsFromString(
    documents: string,
    contentType: ContentType,
    queryParams?: RawDocumentAdditionOptions,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/documents`;

    return this.#httpRequestsWithTask.put(url, documents, queryParams, {
      headers: {
        "Content-Type": contentType,
      },
    });
  }

  /**
   * Delete one document
   *
   * @param documentId - Id of Document to delete
   * @returns Promise containing an EnqueuedTask
   */
  deleteDocument(documentId: string | number): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/documents/${documentId}`;
    return this.#httpRequestsWithTask.delete(url);
  }

  /**
   * Delete multiples documents of an index.
   *
   * @param params - Params value can be:
   *
   *   - DocumentsDeletionQuery: An object containing the parameters to customize
   *       your document deletion. Only available in Meilisearch v1.2 and newer
   *   - DocumentsIds: An array of document ids to delete
   *
   * @returns Promise containing an EnqueuedTask
   */
  deleteDocuments(
    params: DocumentsDeletionQuery | DocumentsIds,
  ): EnqueuedTaskPromise {
    // If params is of type DocumentsDeletionQuery
    const isDocumentsDeletionQuery =
      !Array.isArray(params) && typeof params === "object";
    const endpoint = isDocumentsDeletionQuery
      ? "documents/delete"
      : "documents/delete-batch";
    const url = `indexes/${this.uid}/${endpoint}`;

    return this.#httpRequestsWithTask.post(url, params);
  }

  /**
   * Delete all documents of an index
   *
   * @returns Promise containing an EnqueuedTask
   */
  deleteAllDocuments(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/documents`;
    return this.#httpRequestsWithTask.delete(url);
  }

  /**
   * This is an EXPERIMENTAL feature, which may break without a major version.
   * It's available after Meilisearch v1.10.
   *
   * More info about the feature:
   * https://github.com/orgs/meilisearch/discussions/762 More info about
   * experimental features in general:
   * https://www.meilisearch.com/docs/reference/api/experimental-features
   *
   * @param options - Object containing the function string and related options
   * @returns Promise containing an EnqueuedTask
   */
  updateDocumentsByFunction(
    options: UpdateDocumentsByFunctionOptions,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/documents/edit`;
    return this.#httpRequestsWithTask.post(url, options);
  }

  ///
  /// SETTINGS
  ///

  /**
   * Retrieve all settings
   *
   * @returns Promise containing Settings object
   */
  async getSettings(): Promise<Settings> {
    const url = `indexes/${this.uid}/settings`;
    return await this.httpRequest.get<Settings>(url);
  }

  /**
   * Update all settings Any parameters not provided will be left unchanged.
   *
   * @param settings - Object containing parameters with their updated values
   * @returns Promise containing an EnqueuedTask
   */
  updateSettings(settings: Settings): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings`;
    return this.#httpRequestsWithTask.patch(url, settings);
  }

  /**
   * Reset settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSettings(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// PAGINATION SETTINGS
  ///

  /**
   * Get the pagination settings.
   *
   * @returns Promise containing object of pagination settings
   */
  async getPagination(): Promise<PaginationSettings> {
    const url = `indexes/${this.uid}/settings/pagination`;
    return await this.httpRequest.get<PaginationSettings>(url);
  }

  /**
   * Update the pagination settings.
   *
   * @param pagination - Pagination object
   * @returns Promise containing an EnqueuedTask
   */
  updatePagination(pagination: PaginationSettings): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/pagination`;
    return this.#httpRequestsWithTask.patch(url, pagination);
  }

  /**
   * Reset the pagination settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetPagination(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/pagination`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// SYNONYMS
  ///

  /**
   * Get the list of all synonyms
   *
   * @returns Promise containing object of synonym mappings
   */
  async getSynonyms(): Promise<object> {
    const url = `indexes/${this.uid}/settings/synonyms`;
    return await this.httpRequest.get<object>(url);
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   *
   * @param synonyms - Mapping of synonyms with their associated words
   * @returns Promise containing an EnqueuedTask
   */
  updateSynonyms(synonyms: Synonyms): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/synonyms`;
    return this.#httpRequestsWithTask.put(url, synonyms);
  }

  /**
   * Reset the synonym list to be empty again
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSynonyms(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/synonyms`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// STOP WORDS
  ///

  /**
   * Get the list of all stop-words
   *
   * @returns Promise containing array of stop-words
   */
  async getStopWords(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/stop-words`;
    return await this.httpRequest.get<string[]>(url);
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   *
   * @param stopWords - Array of strings that contains the stop-words.
   * @returns Promise containing an EnqueuedTask
   */
  updateStopWords(stopWords: StopWords): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/stop-words`;
    return this.#httpRequestsWithTask.put(url, stopWords);
  }

  /**
   * Reset the stop-words list to be empty again
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetStopWords(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/stop-words`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// RANKING RULES
  ///

  /**
   * Get the list of all ranking-rules
   *
   * @returns Promise containing array of ranking-rules
   */
  async getRankingRules(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/ranking-rules`;
    return await this.httpRequest.get<string[]>(url);
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   *
   * @param rankingRules - Array that contain ranking rules sorted by order of
   *   importance.
   * @returns Promise containing an EnqueuedTask
   */
  updateRankingRules(rankingRules: RankingRules): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/ranking-rules`;
    return this.#httpRequestsWithTask.put(url, rankingRules);
  }

  /**
   * Reset the ranking rules list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetRankingRules(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/ranking-rules`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// DISTINCT ATTRIBUTE
  ///

  /**
   * Get the distinct-attribute
   *
   * @returns Promise containing the distinct-attribute of the index
   */
  async getDistinctAttribute(): Promise<string | null> {
    const url = `indexes/${this.uid}/settings/distinct-attribute`;
    return await this.httpRequest.get<string | null>(url);
  }

  /**
   * Update the distinct-attribute.
   *
   * @param distinctAttribute - Field name of the distinct-attribute
   * @returns Promise containing an EnqueuedTask
   */
  updateDistinctAttribute(
    distinctAttribute: DistinctAttribute,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/distinct-attribute`;
    return this.#httpRequestsWithTask.put(url, distinctAttribute);
  }

  /**
   * Reset the distinct-attribute.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDistinctAttribute(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/distinct-attribute`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// FILTERABLE ATTRIBUTES
  ///

  /**
   * Get the filterable-attributes
   *
   * @returns Promise containing an array of filterable-attributes
   */
  async getFilterableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/filterable-attributes`;
    return await this.httpRequest.get<string[]>(url);
  }

  /**
   * Update the filterable-attributes.
   *
   * @param filterableAttributes - Array of strings containing the attributes
   *   that can be used as filters at query time
   * @returns Promise containing an EnqueuedTask
   */
  updateFilterableAttributes(
    filterableAttributes: FilterableAttributes,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/filterable-attributes`;
    return this.#httpRequestsWithTask.put(url, filterableAttributes);
  }

  /**
   * Reset the filterable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFilterableAttributes(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/filterable-attributes`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// SORTABLE ATTRIBUTES
  ///

  /**
   * Get the sortable-attributes
   *
   * @returns Promise containing array of sortable-attributes
   */
  async getSortableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/sortable-attributes`;
    return await this.httpRequest.get<string[]>(url);
  }

  /**
   * Update the sortable-attributes.
   *
   * @param sortableAttributes - Array of strings containing the attributes that
   *   can be used to sort search results at query time
   * @returns Promise containing an EnqueuedTask
   */
  updateSortableAttributes(
    sortableAttributes: SortableAttributes,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/sortable-attributes`;
    return this.#httpRequestsWithTask.put(url, sortableAttributes);
  }

  /**
   * Reset the sortable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSortableAttributes(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/sortable-attributes`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// SEARCHABLE ATTRIBUTE
  ///

  /**
   * Get the searchable-attributes
   *
   * @returns Promise containing array of searchable-attributes
   */
  async getSearchableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/searchable-attributes`;
    return await this.httpRequest.get<string[]>(url);
  }

  /**
   * Update the searchable-attributes.
   *
   * @param searchableAttributes - Array of strings that contains searchable
   *   attributes sorted by order of importance(most to least important)
   * @returns Promise containing an EnqueuedTask
   */
  updateSearchableAttributes(
    searchableAttributes: SearchableAttributes,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/searchable-attributes`;
    return this.#httpRequestsWithTask.put(url, searchableAttributes);
  }

  /**
   * Reset the searchable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSearchableAttributes(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/searchable-attributes`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// DISPLAYED ATTRIBUTE
  ///

  /**
   * Get the displayed-attributes
   *
   * @returns Promise containing array of displayed-attributes
   */
  async getDisplayedAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/displayed-attributes`;
    return await this.httpRequest.get<string[]>(url);
  }

  /**
   * Update the displayed-attributes.
   *
   * @param displayedAttributes - Array of strings that contains attributes of
   *   an index to display
   * @returns Promise containing an EnqueuedTask
   */
  updateDisplayedAttributes(
    displayedAttributes: DisplayedAttributes,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/displayed-attributes`;
    return this.#httpRequestsWithTask.put(url, displayedAttributes);
  }

  /**
   * Reset the displayed-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDisplayedAttributes(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/displayed-attributes`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// TYPO TOLERANCE
  ///

  /**
   * Get the typo tolerance settings.
   *
   * @returns Promise containing the typo tolerance settings.
   */
  async getTypoTolerance(): Promise<TypoTolerance> {
    const url = `indexes/${this.uid}/settings/typo-tolerance`;
    return await this.httpRequest.get<TypoTolerance>(url);
  }

  /**
   * Update the typo tolerance settings.
   *
   * @param typoTolerance - Object containing the custom typo tolerance
   *   settings.
   * @returns Promise containing object of the enqueued update
   */
  updateTypoTolerance(typoTolerance: TypoTolerance): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/typo-tolerance`;
    return this.#httpRequestsWithTask.patch(url, typoTolerance);
  }

  /**
   * Reset the typo tolerance settings.
   *
   * @returns Promise containing object of the enqueued update
   */
  resetTypoTolerance(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/typo-tolerance`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// FACETING
  ///

  /**
   * Get the faceting settings.
   *
   * @returns Promise containing object of faceting index settings
   */
  async getFaceting(): Promise<Faceting> {
    const url = `indexes/${this.uid}/settings/faceting`;
    return await this.httpRequest.get<Faceting>(url);
  }

  /**
   * Update the faceting settings.
   *
   * @param faceting - Faceting index settings object
   * @returns Promise containing an EnqueuedTask
   */
  updateFaceting(faceting: Faceting): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/faceting`;
    return this.#httpRequestsWithTask.patch(url, faceting);
  }

  /**
   * Reset the faceting settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFaceting(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/faceting`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// SEPARATOR TOKENS
  ///

  /**
   * Get the list of all separator tokens.
   *
   * @returns Promise containing array of separator tokens
   */
  async getSeparatorTokens(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/separator-tokens`;
    return await this.httpRequest.get<string[]>(url);
  }

  /**
   * Update the list of separator tokens. Overwrite the old list.
   *
   * @param separatorTokens - Array that contains separator tokens.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateSeparatorTokens(separatorTokens: SeparatorTokens): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/separator-tokens`;
    return this.#httpRequestsWithTask.put(url, separatorTokens);
  }

  /**
   * Reset the separator tokens list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSeparatorTokens(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/separator-tokens`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// NON-SEPARATOR TOKENS
  ///

  /**
   * Get the list of all non-separator tokens.
   *
   * @returns Promise containing array of non-separator tokens
   */
  async getNonSeparatorTokens(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/non-separator-tokens`;
    return await this.httpRequest.get<string[]>(url);
  }

  /**
   * Update the list of non-separator tokens. Overwrite the old list.
   *
   * @param nonSeparatorTokens - Array that contains non-separator tokens.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateNonSeparatorTokens(
    nonSeparatorTokens: NonSeparatorTokens,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/non-separator-tokens`;
    return this.#httpRequestsWithTask.put(url, nonSeparatorTokens);
  }

  /**
   * Reset the non-separator tokens list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetNonSeparatorTokens(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/non-separator-tokens`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// DICTIONARY
  ///

  /**
   * Get the dictionary settings of a Meilisearch index.
   *
   * @returns Promise containing the dictionary settings
   */
  async getDictionary(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/dictionary`;
    return await this.httpRequest.get<string[]>(url);
  }

  /**
   * Update the dictionary settings. Overwrite the old settings.
   *
   * @param dictionary - Array that contains the new dictionary settings.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateDictionary(dictionary: Dictionary): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/dictionary`;
    return this.#httpRequestsWithTask.put(url, dictionary);
  }

  /**
   * Reset the dictionary settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDictionary(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/dictionary`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// PROXIMITY PRECISION
  ///

  /**
   * Get the proximity precision settings of a Meilisearch index.
   *
   * @returns Promise containing the proximity precision settings
   */
  async getProximityPrecision(): Promise<ProximityPrecision> {
    const url = `indexes/${this.uid}/settings/proximity-precision`;
    return await this.httpRequest.get<ProximityPrecision>(url);
  }

  /**
   * Update the proximity precision settings. Overwrite the old settings.
   *
   * @param proximityPrecision - String that contains the new proximity
   *   precision settings.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateProximityPrecision(
    proximityPrecision: ProximityPrecision,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/proximity-precision`;
    return this.#httpRequestsWithTask.put(url, proximityPrecision);
  }

  /**
   * Reset the proximity precision settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetProximityPrecision(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/proximity-precision`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// EMBEDDERS
  ///

  /**
   * Get the embedders settings of a Meilisearch index.
   *
   * @returns Promise containing the embedders settings
   */
  async getEmbedders(): Promise<Embedders> {
    const url = `indexes/${this.uid}/settings/embedders`;
    return await this.httpRequest.get<Embedders>(url);
  }

  /**
   * Update the embedders settings. Overwrite the old settings.
   *
   * @param embedders - Object that contains the new embedders settings.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateEmbedders(embedders: Embedders): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/embedders`;
    return this.#httpRequestsWithTask.patch(url, embedders);
  }

  /**
   * Reset the embedders settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetEmbedders(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/embedders`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// SEARCHCUTOFFMS SETTINGS
  ///

  /**
   * Get the SearchCutoffMs settings.
   *
   * @returns Promise containing object of SearchCutoffMs settings
   */
  async getSearchCutoffMs(): Promise<SearchCutoffMs> {
    const url = `indexes/${this.uid}/settings/search-cutoff-ms`;
    return await this.httpRequest.get<SearchCutoffMs>(url);
  }

  /**
   * Update the SearchCutoffMs settings.
   *
   * @param searchCutoffMs - Object containing SearchCutoffMsSettings
   * @returns Promise containing an EnqueuedTask
   */
  updateSearchCutoffMs(searchCutoffMs: SearchCutoffMs): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/search-cutoff-ms`;
    return this.#httpRequestsWithTask.put(url, searchCutoffMs);
  }

  /**
   * Reset the SearchCutoffMs settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSearchCutoffMs(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/search-cutoff-ms`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// LOCALIZED ATTRIBUTES SETTINGS
  ///

  /**
   * Get the localized attributes settings.
   *
   * @returns Promise containing object of localized attributes settings
   */
  async getLocalizedAttributes(): Promise<LocalizedAttributes> {
    const url = `indexes/${this.uid}/settings/localized-attributes`;
    return await this.httpRequest.get<LocalizedAttributes>(url);
  }

  /**
   * Update the localized attributes settings.
   *
   * @param localizedAttributes - Localized attributes object
   * @returns Promise containing an EnqueuedTask
   */
  updateLocalizedAttributes(
    localizedAttributes: LocalizedAttributes,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/localized-attributes`;
    return this.#httpRequestsWithTask.put(url, localizedAttributes);
  }

  /**
   * Reset the localized attributes settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetLocalizedAttributes(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/localized-attributes`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// FACET SEARCH SETTINGS
  ///

  /**
   * Get the facet search settings.
   *
   * @returns Promise containing object of facet search settings
   */
  async getFacetSearch(): Promise<boolean> {
    const url = `indexes/${this.uid}/settings/facet-search`;
    return await this.httpRequest.get<boolean>(url);
  }

  /**
   * Update the facet search settings.
   *
   * @param facetSearch - Boolean value
   * @returns Promise containing an EnqueuedTask
   */
  updateFacetSearch(facetSearch: boolean): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/facet-search`;
    return this.#httpRequestsWithTask.put(url, facetSearch);
  }

  /**
   * Reset the facet search settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFacetSearch(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/facet-search`;
    return this.#httpRequestsWithTask.delete(url);
  }

  ///
  /// PREFIX SEARCH SETTINGS
  ///

  /**
   * Get the prefix search settings.
   *
   * @returns Promise containing object of prefix search settings
   */
  async getPrefixSearch(): Promise<PrefixSearch> {
    const url = `indexes/${this.uid}/settings/prefix-search`;
    return await this.httpRequest.get<PrefixSearch>(url);
  }

  /**
   * Update the prefix search settings.
   *
   * @param prefixSearch - PrefixSearch value
   * @returns Promise containing an EnqueuedTask
   */
  updatePrefixSearch(prefixSearch: PrefixSearch): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/prefix-search`;
    return this.#httpRequestsWithTask.put(url, prefixSearch);
  }

  /**
   * Reset the prefix search settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetPrefixSearch(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/prefix-search`;
    return this.#httpRequestsWithTask.delete(url);
  }
}
