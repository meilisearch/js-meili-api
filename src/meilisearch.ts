/*
 * Bundle: MeiliSearch
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

import { Index } from "./indexes.js";
import type {
  KeyCreation,
  Config,
  IndexOptions,
  IndexObject,
  Key,
  Health,
  Stats,
  Version,
  KeyUpdate,
  IndexesQuery,
  IndexesResults,
  KeysQuery,
  KeysResults,
  IndexSwap,
  MultiSearchParams,
  FederatedMultiSearchParams,
  MultiSearchResponseOrSearchResponse,
  EnqueuedTaskPromise,
} from "./types/index.js";
import { ErrorStatusCode } from "./types/index.js";
import { HttpRequests } from "./http-requests.js";
import {
  getHttpRequestsWithEnqueuedTaskPromise,
  TaskClient,
  type HttpRequestsWithEnqueuedTaskPromise,
} from "./task.js";
import { BatchClient } from "./batch.js";

export class MeiliSearch {
  config: Config;
  httpRequest: HttpRequests;

  readonly #taskClient: TaskClient;
  get tasks() {
    return this.#taskClient;
  }

  readonly #batchClient: BatchClient;
  get batches() {
    return this.#batchClient;
  }

  readonly #httpRequestsWithTask: HttpRequestsWithEnqueuedTaskPromise;

  /**
   * Creates new MeiliSearch instance
   *
   * @param config - Configuration object
   */
  constructor(config: Config) {
    this.config = config;
    this.httpRequest = new HttpRequests(config);

    this.#taskClient = new TaskClient(
      this.httpRequest,
      config.defaultWaitOptions,
    );
    this.#batchClient = new BatchClient(this.httpRequest);

    this.#httpRequestsWithTask = getHttpRequestsWithEnqueuedTaskPromise(
      this.httpRequest,
      this.tasks,
    );
  }

  /**
   * Return an Index instance
   *
   * @param indexUid - The index UID
   * @returns Instance of Index
   */
  index<T extends Record<string, any> = Record<string, any>>(
    indexUid: string,
  ): Index<T> {
    return new Index<T>(this.config, indexUid);
  }

  /**
   * Gather information about an index by calling MeiliSearch and return an
   * Index instance with the gathered information
   *
   * @param indexUid - The index UID
   * @returns Promise returning Index instance
   */
  async getIndex<T extends Record<string, any> = Record<string, any>>(
    indexUid: string,
  ): Promise<Index<T>> {
    return new Index<T>(this.config, indexUid).fetchInfo();
  }

  /**
   * Gather information about an index by calling MeiliSearch and return the raw
   * JSON response
   *
   * @param indexUid - The index UID
   * @returns Promise returning index information
   */
  async getRawIndex(indexUid: string): Promise<IndexObject> {
    return new Index(this.config, indexUid).getRawInfo();
  }

  /**
   * Get all the indexes as Index instances.
   *
   * @param parameters - Parameters to browse the indexes
   * @returns Promise returning array of raw index information
   */
  async getIndexes(
    parameters: IndexesQuery = {},
  ): Promise<IndexesResults<Index[]>> {
    const rawIndexes = await this.getRawIndexes(parameters);
    const indexes: Index[] = rawIndexes.results.map(
      (index) => new Index(this.config, index.uid, index.primaryKey),
    );
    return { ...rawIndexes, results: indexes };
  }

  /**
   * Get all the indexes in their raw value (no Index instances).
   *
   * @param parameters - Parameters to browse the indexes
   * @returns Promise returning array of raw index information
   */
  async getRawIndexes(
    parameters: IndexesQuery = {},
  ): Promise<IndexesResults<IndexObject[]>> {
    const url = `indexes`;
    return await this.httpRequest.get<IndexesResults<IndexObject[]>>(
      url,
      parameters,
    );
  }

  /**
   * Create a new index
   *
   * @param uid - The index UID
   * @param options - Index options
   * @returns Promise returning Index instance
   */
  createIndex(uid: string, options?: IndexOptions): EnqueuedTaskPromise {
    return Index.create(uid, options, this.config);
  }

  /**
   * Update an index
   *
   * @param uid - The index UID
   * @param options - Index options to update
   * @returns Promise returning Index instance after updating
   */
  updateIndex(uid: string, options?: IndexOptions): EnqueuedTaskPromise {
    return new Index(this.config, uid).update(options);
  }

  /**
   * Delete an index
   *
   * @param uid - The index UID
   * @returns Promise which resolves when index is deleted successfully
   */
  deleteIndex(uid: string): EnqueuedTaskPromise {
    return new Index(this.config, uid).delete();
  }

  /**
   * Deletes an index if it already exists.
   *
   * @param uid - The index UID
   * @returns Promise which resolves to true when index exists and is deleted
   *   successfully, otherwise false if it does not exist
   */
  async deleteIndexIfExists(uid: string): Promise<boolean> {
    try {
      await this.deleteIndex(uid);
      return true;
    } catch (e: any) {
      if (e.code === ErrorStatusCode.INDEX_NOT_FOUND) {
        return false;
      }
      throw e;
    }
  }

  /**
   * Swaps a list of index tuples.
   *
   * @param params - List of indexes tuples to swap.
   * @returns Promise returning object of the enqueued task
   */
  swapIndexes(params: IndexSwap[]): EnqueuedTaskPromise {
    const url = "/swap-indexes";
    return this.#httpRequestsWithTask.post(url, params);
  }

  ///
  /// Multi Search
  ///

  /**
   * Perform multiple search queries.
   *
   * It is possible to make multiple search queries on the same index or on
   * different ones
   *
   * @example
   *
   * ```ts
   * client.multiSearch({
   *   queries: [
   *     { indexUid: "movies", q: "wonder" },
   *     { indexUid: "books", q: "flower" },
   *   ],
   * });
   * ```
   *
   * @param queries - Search queries
   * @param config - Additional request configuration options
   * @returns Promise containing the search responses
   */
  async multiSearch<
    T1 extends MultiSearchParams | FederatedMultiSearchParams,
    T2 extends Record<string, unknown> = Record<string, any>,
  >(
    queries: T1,
    config?: Partial<Request>,
  ): Promise<MultiSearchResponseOrSearchResponse<T1, T2>> {
    const url = `multi-search`;

    return await this.httpRequest.post(url, queries, undefined, config);
  }

  ///
  /// KEYS
  ///

  /**
   * Get all API keys
   *
   * @param parameters - Parameters to browse the indexes
   * @returns Promise returning an object with keys
   */
  async getKeys(parameters: KeysQuery = {}): Promise<KeysResults> {
    const url = `keys`;
    const keys = await this.httpRequest.get<KeysResults>(url, parameters);

    keys.results = keys.results.map((key) => ({
      ...key,
      createdAt: new Date(key.createdAt),
      updatedAt: new Date(key.updatedAt),
    }));

    return keys;
  }

  /**
   * Get one API key
   *
   * @param keyOrUid - Key or uid of the API key
   * @returns Promise returning a key
   */
  async getKey(keyOrUid: string): Promise<Key> {
    const url = `keys/${keyOrUid}`;
    return await this.httpRequest.get<Key>(url);
  }

  /**
   * Create one API key
   *
   * @param options - Key options
   * @returns Promise returning a key
   */
  async createKey(options: KeyCreation): Promise<Key> {
    const url = `keys`;
    return await this.httpRequest.post(url, options);
  }

  /**
   * Update one API key
   *
   * @param keyOrUid - Key
   * @param options - Key options
   * @returns Promise returning a key
   */
  async updateKey(keyOrUid: string, options: KeyUpdate): Promise<Key> {
    const url = `keys/${keyOrUid}`;
    return await this.httpRequest.patch(url, options);
  }

  /**
   * Delete one API key
   *
   * @param keyOrUid - Key
   * @returns
   */
  async deleteKey(keyOrUid: string): Promise<void> {
    const url = `keys/${keyOrUid}`;
    return await this.httpRequest.delete<any>(url);
  }

  ///
  /// HEALTH
  ///

  /**
   * Checks if the server is healthy, otherwise an error will be thrown.
   *
   * @returns Promise returning an object with health details
   */
  async health(): Promise<Health> {
    const url = `health`;
    return await this.httpRequest.get<Health>(url);
  }

  /**
   * Checks if the server is healthy, return true or false.
   *
   * @returns Promise returning a boolean
   */
  async isHealthy(): Promise<boolean> {
    try {
      const url = `health`;
      await this.httpRequest.get(url);
      return true;
    } catch {
      return false;
    }
  }

  ///
  /// STATS
  ///

  /**
   * Get the stats of all the database
   *
   * @returns Promise returning object of all the stats
   */
  async getStats(): Promise<Stats> {
    const url = `stats`;
    return await this.httpRequest.get<Stats>(url);
  }

  ///
  /// VERSION
  ///

  /**
   * Get the version of MeiliSearch
   *
   * @returns Promise returning object with version details
   */
  async getVersion(): Promise<Version> {
    const url = `version`;
    return await this.httpRequest.get<Version>(url);
  }

  ///
  /// DUMPS
  ///

  /**
   * Creates a dump
   *
   * @returns Promise returning object of the enqueued task
   */
  createDump(): EnqueuedTaskPromise {
    const url = `dumps`;
    return this.#httpRequestsWithTask.post(url);
  }

  ///
  /// SNAPSHOTS
  ///

  /**
   * Creates a snapshot
   *
   * @returns Promise returning object of the enqueued task
   */
  createSnapshot(): EnqueuedTaskPromise {
    const url = `snapshots`;
    return this.#httpRequestsWithTask.post(url);
  }
}
