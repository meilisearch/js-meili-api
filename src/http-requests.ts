import type {
  Config,
  HttpRequestsRequestInit,
  MethodOptions,
  RequestOptions,
  URLSearchParamsRecord,
} from "./types";
import { PACKAGE_VERSION } from "./package-version";

import {
  MeiliSearchError,
  MeiliSearchApiError,
  MeiliSearchRequestError,
} from "./errors";

import { addProtocolIfNotPresent, addTrailingSlash } from "./utils";

function appendRecordToURLSearchParams(
  searchParams: URLSearchParams,
  recordToAppend: URLSearchParamsRecord,
): void {
  for (const [key, val] of Object.entries(recordToAppend)) {
    if (val != null) {
      searchParams.set(
        key,
        Array.isArray(val)
          ? val.join()
          : val instanceof Date
            ? val.toISOString()
            : String(val),
      );
    }
  }
}

function getHeaders(config: Config, headersInit?: HeadersInit): Headers {
  const agentHeader = "X-Meilisearch-Client";
  const packageAgent = `Meilisearch JavaScript (v${PACKAGE_VERSION})`;
  const contentType = "Content-Type";
  const authorization = "Authorization";

  const headers = new Headers(headersInit);

  // do not override if user provided the header
  if (config.apiKey && !headers.has(authorization)) {
    headers.set(authorization, `Bearer ${config.apiKey}`);
  }

  if (!headers.has(contentType)) {
    headers.set("Content-Type", "application/json");
  }

  // Creates the custom user agent with information on the package used.
  if (config.clientAgents && Array.isArray(config.clientAgents)) {
    const clients = config.clientAgents.concat(packageAgent);

    headers.set(agentHeader, clients.join(" ; "));
  } else if (config.clientAgents && !Array.isArray(config.clientAgents)) {
    // If the header is defined but not an array
    throw new MeiliSearchError(
      `Meilisearch: The header "${agentHeader}" should be an array of string(s).\n`,
    );
  } else {
    headers.set(agentHeader, packageAgent);
  }

  return headers;
}

// This could be a symbol, but Node.js 18 fetch doesn't support that yet
// https://github.com/nodejs/node/issues/49557
const TIMEOUT_OBJECT = {};

// Attach a timeout signal to `requestInit`,
// while preserving original signal functionality
// NOTE: This could be a short few straight forward lines using the following:
//       https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static
//       https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
//       But these aren't yet widely supported enough perhaps, nor polyfillable
function getTimeoutFn(
  requestInit: RequestInit,
  ms: number,
): () => (() => void) | void {
  const { signal } = requestInit;
  const ac = new AbortController();

  if (signal != null) {
    let acSignalFn: (() => void) | null = null;

    if (signal.aborted) {
      ac.abort(signal.reason);
    } else {
      const fn = () => ac.abort(signal.reason);

      signal.addEventListener("abort", fn, { once: true });

      acSignalFn = () => signal.removeEventListener("abort", fn);
      ac.signal.addEventListener("abort", acSignalFn, { once: true });
    }

    return () => {
      if (signal.aborted) {
        return;
      }

      const to = setTimeout(() => ac.abort(TIMEOUT_OBJECT), ms);
      const fn = () => {
        clearTimeout(to);

        if (acSignalFn !== null) {
          ac.signal.removeEventListener("abort", acSignalFn);
        }
      };

      signal.addEventListener("abort", fn, { once: true });

      return () => {
        signal.removeEventListener("abort", fn);
        fn();
      };
    };
  }

  requestInit.signal = ac.signal;

  return () => {
    const to = setTimeout(() => ac.abort(TIMEOUT_OBJECT), ms);
    return () => clearTimeout(to);
  };
}

export class HttpRequests {
  #url: URL;
  #requestInit: HttpRequestsRequestInit;
  #requestFn: typeof fetch;
  #isCustomRequestFnProvided: boolean;
  #requestTimeout?: number;

  constructor(config: Config) {
    const host = addTrailingSlash(addProtocolIfNotPresent(config.host));

    try {
      this.#url = new URL(host);
    } catch (error) {
      throw new MeiliSearchError("The provided host is not valid", {
        cause: error,
      });
    }

    this.#requestInit = {
      ...config.requestInit,
      headers: getHeaders(config, config.requestInit?.headers),
    };

    this.#requestFn =
      config.httpClient ??
      // in browsers `fetch` can only be called with a `this` pointing to `window`
      fetch.bind(typeof window !== "undefined" ? window : globalThis);
    this.#isCustomRequestFnProvided = config.httpClient !== undefined;
    this.#requestTimeout = config.timeout;
  }

  // combine headers, with the following priority:
  // 1. `headers` - primary headers provided by functions in Index and Client
  // 2. `this.#requestInit.headers` - main headers of this class
  // 3. `extraHeaders` - extra headers provided in search functions by users
  #getHeaders(
    headers?: HeadersInit,
    extraHeaders?: HeadersInit,
  ): { finalHeaders: Headers; isCustomContentTypeProvided: boolean } {
    let isCustomContentTypeProvided: boolean;

    if (headers !== undefined || extraHeaders !== undefined) {
      headers = new Headers(headers);
      isCustomContentTypeProvided = headers.has("Content-Type");

      for (const [key, val] of this.#requestInit.headers.entries()) {
        if (!headers.has(key)) {
          headers.set(key, val);
        }
      }

      if (extraHeaders !== undefined) {
        for (const [key, val] of new Headers(extraHeaders).entries()) {
          if (!headers.has(key)) {
            headers.set(key, val);
          }
        }
      }
    } else {
      isCustomContentTypeProvided = false;
    }

    const finalHeaders = headers ?? this.#requestInit.headers;

    return { finalHeaders, isCustomContentTypeProvided };
  }

  async #request({
    relativeURL,
    method,
    params,
    headers,
    body,
    extraRequestInit,
  }: RequestOptions): Promise<unknown> {
    const url = new URL(relativeURL, this.#url);
    if (params !== undefined) {
      appendRecordToURLSearchParams(url.searchParams, params);
    }

    const { finalHeaders, isCustomContentTypeProvided } = this.#getHeaders(
      headers,
      extraRequestInit?.headers,
    );

    const requestInit: RequestInit = {
      method,
      body:
        // in case a custom content-type is provided do not stringify body
        typeof body !== "string" || !isCustomContentTypeProvided
          ? // this will throw an error for any value that is not serializable
            JSON.stringify(body)
          : body,
      ...extraRequestInit,
      ...this.#requestInit,
      headers: finalHeaders,
    };

    const startTimeout =
      this.#requestTimeout !== undefined
        ? getTimeoutFn(requestInit, this.#requestTimeout)
        : null;

    const responsePromise = this.#requestFn(url, requestInit);
    const stopTimeout = startTimeout?.();

    const response = await responsePromise
      .catch((error: unknown) => {
        throw new MeiliSearchRequestError(
          url.toString(),
          Object.is(error, TIMEOUT_OBJECT)
            ? new Error(`request timed out after ${this.#requestTimeout}ms`, {
                cause: requestInit,
              })
            : error,
        );
      })
      .finally(() => stopTimeout?.());

    // When using a custom HTTP client, the response is returned to allow the user to parse/handle it as they see fit
    if (this.#isCustomRequestFnProvided) {
      return response;
    }

    const responseBody = await response.text();
    const parsedResponse =
      responseBody === "" ? undefined : JSON.parse(responseBody);

    if (!response.ok) {
      throw new MeiliSearchApiError(response, parsedResponse);
    }

    return parsedResponse;
  }

  get(options: MethodOptions) {
    return this.#request(options);
  }

  post(options: MethodOptions) {
    return this.#request({ ...options, method: "POST" });
  }

  put(options: MethodOptions) {
    return this.#request({ ...options, method: "PUT" });
  }

  patch(options: MethodOptions) {
    return this.#request({ ...options, method: "PATCH" });
  }

  delete(options: MethodOptions) {
    return this.#request({ ...options, method: "DELETE" });
  }
}
