import type {
  Batch,
  BatchesResults,
  TasksOrBatchesQuery,
} from "./types/index.js";
import { type HttpRequests, toQueryParams } from "./http-requests.js";

/**
 * Class for handling batches.
 *
 * @see {@link https://www.meilisearch.com/docs/reference/api/batches}
 */
export class BatchClient {
  readonly #httpRequest: HttpRequests;

  constructor(httpRequests: HttpRequests) {
    this.#httpRequest = httpRequests;
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/batches#get-one-batch} */
  async getBatch(uid: number): Promise<Batch> {
    const url = `batches/${uid}`;
    const batch = await this.#httpRequest.get<Batch>(url);
    return batch;
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/batches#get-batches} */
  async getBatches(parameters?: TasksOrBatchesQuery): Promise<BatchesResults> {
    const url = `batches`;

    const batches = await this.#httpRequest.get<Promise<BatchesResults>>(
      url,
      toQueryParams<TasksOrBatchesQuery>(parameters ?? {}),
    );

    return batches;
  }
}
