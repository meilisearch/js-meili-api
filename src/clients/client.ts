/*
 * Bundle: MeiliSearch
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

import { Index } from "../indexes";
import {
  KeyCreation,
  Config,
  IndexOptions,
  IndexObject,
  Key,
  Health,
  Stats,
  Version,
  ErrorStatusCode,
  TokenSearchRules,
  TokenOptions,
  KeyUpdate,
  IndexesQuery,
  IndexesResults,
  KeysQuery,
  KeysResults,
  EnqueuedTaskObject,
  SwapIndexesParams,
  MultiSearchParams,
  MultiSearchResponse,
  SearchResponse,
  FederatedMultiSearchParams,
  ExtraRequestInit,
} from "../types";
import { HttpRequests } from "../http-requests";
import { TaskClient } from "../task";
import { EnqueuedTask } from "../enqueued-task";

class Client {
  config: Config;
  httpRequest: HttpRequests;
  tasks: TaskClient;

  /**
   * Creates new MeiliSearch instance
   *
   * @param config - Configuration object
   */
  constructor(config: Config) {
    this.config = config;
    this.httpRequest = new HttpRequests(config);
    this.tasks = new TaskClient(config);
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
    parameters?: IndexesQuery,
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
    parameters?: IndexesQuery,
  ): Promise<IndexesResults<IndexObject[]>> {
    return (await this.httpRequest.get({
      relativeURL: "indexes",
      params: parameters,
    })) as IndexesResults<IndexObject[]>;
  }

  /**
   * Create a new index
   *
   * @param uid - The index UID
   * @param options - Index options
   * @returns Promise returning Index instance
   */
  async createIndex(
    uid: string,
    options?: IndexOptions,
  ): Promise<EnqueuedTask> {
    return await Index.create(uid, options, this.config);
  }

  /**
   * Update an index
   *
   * @param uid - The index UID
   * @param options - Index options to update
   * @returns Promise returning Index instance after updating
   */
  async updateIndex(
    uid: string,
    options?: IndexOptions,
  ): Promise<EnqueuedTask> {
    return await new Index(this.config, uid).update(options);
  }

  /**
   * Delete an index
   *
   * @param uid - The index UID
   * @returns Promise which resolves when index is deleted successfully
   */
  async deleteIndex(uid: string): Promise<EnqueuedTask> {
    return await new Index(this.config, uid).delete();
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
    } catch (e) {
      if (
        (e as { code?: ErrorStatusCode }).code ===
        ErrorStatusCode.INDEX_NOT_FOUND
      ) {
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
  async swapIndexes(params: SwapIndexesParams): Promise<EnqueuedTask> {
    const url = "/swap-indexes";
    const taks = (await this.httpRequest.post({
      relativeURL: url,
      body: params,
    })) as EnqueuedTaskObject;

    return new EnqueuedTask(taks);
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
  multiSearch<T extends Record<string, unknown> = Record<string, any>>(
    queries: MultiSearchParams,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<MultiSearchResponse<T>>;
  multiSearch<T extends Record<string, unknown> = Record<string, any>>(
    queries: FederatedMultiSearchParams,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<SearchResponse<T>>;
  async multiSearch<T extends Record<string, unknown> = Record<string, any>>(
    queries: MultiSearchParams | FederatedMultiSearchParams,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<MultiSearchResponse<T> | SearchResponse<T>> {
    return (await this.httpRequest.post({
      relativeURL: "multi-search",
      body: queries,
      extraRequestInit,
    })) as MultiSearchResponse<T> | SearchResponse<T>;
  }

  ///
  /// TASKS
  ///

  /**
   * Get the list of all client tasks
   *
   * @param parameters - Parameters to browse the tasks
   * @returns Promise returning all tasks
   */
  async getTasks(
    ...params: Parameters<TaskClient["getTasks"]>
  ): ReturnType<TaskClient["getTasks"]> {
    return await this.tasks.getTasks(...params);
  }

  /**
   * Get one task on the client scope
   *
   * @param taskUid - Task identifier
   * @returns Promise returning a task
   */
  async getTask(
    ...params: Parameters<TaskClient["getTask"]>
  ): ReturnType<TaskClient["getTask"]> {
    return await this.tasks.getTask(...params);
  }

  /**
   * Wait for multiple tasks to be finished.
   *
   * @param taskUids - Tasks identifier
   * @param waitOptions - Options on timeout and interval
   * @returns Promise returning an array of tasks
   */
  async waitForTasks(
    ...params: Parameters<TaskClient["waitForTasks"]>
  ): ReturnType<TaskClient["waitForTasks"]> {
    return await this.tasks.waitForTasks(...params);
  }

  /**
   * Wait for a task to be finished.
   *
   * @param taskUid - Task identifier
   * @param waitOptions - Options on timeout and interval
   * @returns Promise returning an array of tasks
   */
  async waitForTask(
    ...params: Parameters<TaskClient["waitForTask"]>
  ): ReturnType<TaskClient["waitForTask"]> {
    return await this.tasks.waitForTask(...params);
  }

  /**
   * Cancel a list of enqueued or processing tasks.
   *
   * @param parameters - Parameters to filter the tasks.
   * @returns Promise containing an EnqueuedTask
   */
  async cancelTasks(
    ...params: Parameters<TaskClient["cancelTasks"]>
  ): ReturnType<TaskClient["cancelTasks"]> {
    return await this.tasks.cancelTasks(...params);
  }

  /**
   * Delete a list of tasks.
   *
   * @param parameters - Parameters to filter the tasks.
   * @returns Promise containing an EnqueuedTask
   */
  async deleteTasks(
    ...params: Parameters<TaskClient["deleteTasks"]>
  ): ReturnType<TaskClient["deleteTasks"]> {
    return await this.tasks.deleteTasks(...params);
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
  async getKeys(parameters?: KeysQuery): Promise<KeysResults> {
    const keys = (await this.httpRequest.get({
      relativeURL: "keys",
      params: parameters,
    })) as KeysResults;

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
    return (await this.httpRequest.get({
      relativeURL: `keys/${keyOrUid}`,
    })) as Key;
  }

  /**
   * Create one API key
   *
   * @param options - Key options
   * @returns Promise returning a key
   */
  async createKey(options: KeyCreation): Promise<Key> {
    return (await this.httpRequest.post({
      relativeURL: "keys",
      body: options,
    })) as Key;
  }

  /**
   * Update one API key
   *
   * @param keyOrUid - Key
   * @param options - Key options
   * @returns Promise returning a key
   */
  async updateKey(keyOrUid: string, options: KeyUpdate): Promise<Key> {
    return (await this.httpRequest.patch({
      relativeURL: `keys/${keyOrUid}`,
      body: options,
    })) as Key;
  }

  /**
   * Delete one API key
   *
   * @param keyOrUid - Key
   * @returns
   */
  async deleteKey(keyOrUid: string): Promise<void> {
    await this.httpRequest.delete({ relativeURL: `keys/${keyOrUid}` });
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
    return (await this.httpRequest.get({ relativeURL: "health" })) as Health;
  }

  /**
   * Checks if the server is healthy, return true or false.
   *
   * @returns Promise returning a boolean
   */
  async isHealthy(): Promise<boolean> {
    try {
      const { status } = await this.health();
      return status === "available";
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
    return (await this.httpRequest.get({ relativeURL: "stats" })) as Stats;
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
    return (await this.httpRequest.get({ relativeURL: "version" })) as Version;
  }

  ///
  /// DUMPS
  ///

  /**
   * Creates a dump
   *
   * @returns Promise returning object of the enqueued task
   */
  async createDump(): Promise<EnqueuedTask> {
    const task = (await this.httpRequest.post({
      relativeURL: "dumps",
    })) as EnqueuedTaskObject;

    return new EnqueuedTask(task);
  }

  ///
  /// SNAPSHOTS
  ///

  /**
   * Creates a snapshot
   *
   * @returns Promise returning object of the enqueued task
   */
  async createSnapshot(): Promise<EnqueuedTask> {
    const task = (await this.httpRequest.post({
      relativeURL: "snapshots",
    })) as EnqueuedTaskObject;

    return new EnqueuedTask(task);
  }

  ///
  /// TOKENS
  ///

  /**
   * Generate a tenant token
   *
   * @param apiKeyUid - The uid of the api key used as issuer of the token.
   * @param searchRules - Search rules that are applied to every search.
   * @param options - Token options to customize some aspect of the token.
   * @returns The token in JWT format.
   */
  generateTenantToken(
    _apiKeyUid: string,
    _searchRules: TokenSearchRules,
    _options?: TokenOptions,
  ): Promise<string> {
    const error = new Error();
    error.message = `Meilisearch: failed to generate a tenant token. Generation of a token only works in a node environment \n ${error.stack}.`;

    return Promise.reject(error);
  }
}

export { Client };
