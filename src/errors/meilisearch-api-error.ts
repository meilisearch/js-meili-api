import type { MeiliSearchErrorResponse } from "../types/index.js";
import { MeiliSearchError } from "./meilisearch-error.js";

export class MeiliSearchApiError extends MeiliSearchError {
  override name = "MeiliSearchApiError";
  override cause?: MeiliSearchErrorResponse;
  readonly response: Response;

  constructor(response: Response, responseBody?: MeiliSearchErrorResponse) {
    super(
      responseBody?.message ?? `${response.status}: ${response.statusText}`,
    );

    this.response = response;

    if (responseBody !== undefined) {
      this.cause = responseBody;
    }
  }
}
