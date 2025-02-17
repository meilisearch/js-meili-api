import type {
  Config,
  BatchObject,
  BatchesQuery,
  BatchesResults,
  BatchesResultsObject,
} from "./types/index.js";
import { HttpRequests, toQueryParams } from "./http-requests.js";

class Batch {
  uid: BatchObject["uid"];
  details: BatchObject["details"];
  stats: BatchObject["stats"];
  startedAt: BatchObject["startedAt"];
  finishedAt: BatchObject["finishedAt"];
  duration: BatchObject["duration"];
  progress: BatchObject["progress"];

  constructor(batch: BatchObject) {
    this.uid = batch.uid;
    this.details = batch.details;
    this.stats = batch.stats;
    this.startedAt = batch.startedAt;
    this.finishedAt = batch.finishedAt;
    this.duration = batch.duration;
    this.progress = batch.progress;
  }
}

class BatchClient {
  httpRequest: HttpRequests;

  constructor(config: Config) {
    this.httpRequest = new HttpRequests(config);
  }

  /**
   * Get one batch
   *
   * @param uid - Unique identifier of the batch
   * @returns
   */
  async getBatch(uid: number): Promise<Batch> {
    const url = `batches/${uid}`;
    const batch = await this.httpRequest.get<BatchObject>(url);
    return new Batch(batch);
  }

  /**
   * Get batches
   *
   * @param parameters - Parameters to browse the batches
   * @returns Promise containing all batches
   */
  async getBatches(parameters: BatchesQuery = {}): Promise<BatchesResults> {
    const url = `batches`;

    const batches = await this.httpRequest.get<Promise<BatchesResultsObject>>(
      url,
      toQueryParams<BatchesQuery>(parameters),
    );

    return {
      ...batches,
      results: batches.results.map((batch) => new Batch(batch)),
    };
  }
}

export { BatchClient, Batch };
