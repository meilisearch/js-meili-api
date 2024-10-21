import { Config, EnqueuedTaskObject } from "./types";
import { PACKAGE_VERSION } from "./package-version";

import {
  MeiliSearchError,
  MeiliSearchApiError,
  MeiliSearchRequestError,
} from "./errors";

import { addTrailingSlash, addProtocolIfNotPresent } from "./utils";

type queryParams<T> = { [key in keyof T]: string };

function toQueryParams<T extends object>(parameters: T): queryParams<T> {
  const params = Object.keys(parameters) as Array<keyof T>;

  const queryParams = params.reduce<queryParams<T>>((acc, key) => {
    const value = parameters[key];
    if (value === undefined) {
      return acc;
    } else if (Array.isArray(value)) {
      return { ...acc, [key]: value.join(",") };
    } else if (value instanceof Date) {
      return { ...acc, [key]: value.toISOString() };
    }
    return { ...acc, [key]: value };
  }, {} as queryParams<T>);
  return queryParams;
}

function constructHostURL(host: string): string {
  try {
    host = addProtocolIfNotPresent(host);
    host = addTrailingSlash(host);
    return host;
  } catch {
    throw new MeiliSearchError("The provided host is not valid.");
  }
}

function cloneAndParseHeaders(headers: HeadersInit): Record<string, string> {
  if (Array.isArray(headers)) {
    return headers.reduce(
      (acc, headerPair) => {
        acc[headerPair[0]] = headerPair[1];
        return acc;
      },
      {} as Record<string, string>,
    );
  } else if ("has" in headers) {
    const clonedHeaders: Record<string, string> = {};
    (headers as Headers).forEach((value, key) => (clonedHeaders[key] = value));
    return clonedHeaders;
  } else {
    return Object.assign({}, headers);
  }
}

function createHeaders(config: Config): Record<string, any> {
  const agentHeader = "X-Meilisearch-Client";
  const packageAgent = `Meilisearch JavaScript (v${PACKAGE_VERSION})`;
  const contentType = "Content-Type";
  const authorization = "Authorization";
  const headers = cloneAndParseHeaders(config.requestConfig?.headers ?? {});

  // do not override if user provided the header
  if (config.apiKey && !headers[authorization]) {
    headers[authorization] = `Bearer ${config.apiKey}`;
  }

  if (!headers[contentType]) {
    headers["Content-Type"] = "application/json";
  }

  // Creates the custom user agent with information on the package used.
  if (config.clientAgents && Array.isArray(config.clientAgents)) {
    const clients = config.clientAgents.concat(packageAgent);

    headers[agentHeader] = clients.join(" ; ");
  } else if (config.clientAgents && !Array.isArray(config.clientAgents)) {
    // If the header is defined but not an array
    throw new MeiliSearchError(
      `Meilisearch: The header "${agentHeader}" should be an array of string(s).\n`,
    );
  } else {
    headers[agentHeader] = packageAgent;
  }

  return headers;
}

class HttpRequests {
  headers: Record<string, any>;
  url: URL;
  requestConfig?: Config["requestConfig"];
  httpClient?: Required<Config>["httpClient"];
  requestTimeout?: number;

  constructor(config: Config) {
    this.headers = createHeaders(config);
    this.requestConfig = config.requestConfig;
    this.httpClient = config.httpClient;
    this.requestTimeout = config.timeout;

    try {
      const host = constructHostURL(config.host);
      this.url = new URL(host);
    } catch {
      throw new MeiliSearchError("The provided host is not valid.");
    }
  }

  async request({
    method,
    url,
    params,
    body,
    config = {},
  }: {
    method: string;
    url: string;
    params?: { [key: string]: any };
    body?: any;
    config?: Record<string, any>;
  }) {
    const constructURL = new URL(url, this.url);
    if (params) {
      const queryParams = new URLSearchParams();
      Object.keys(params)
        .filter((x: string) => params[x] !== null)
        .map((x: string) => queryParams.set(x, params[x]));
      constructURL.search = queryParams.toString();
    }

    // in case a custom content-type is provided
    // do not stringify body
    if (!config.headers || !Object.hasOwn(config.headers, "Content-Type")) {
      body = JSON.stringify(body);
    }

    const headers = { ...this.headers, ...config.headers };
    const responsePromise = this.fetchWithTimeout(
      constructURL.toString(),
      {
        ...config,
        ...this.requestConfig,
        method,
        body,
        headers,
      },
      this.requestTimeout,
    );

    const response = await responsePromise.catch((error: unknown) => {
      throw new MeiliSearchRequestError(constructURL.toString(), error);
    });

    // When using a custom HTTP client, the response is returned to allow the user to parse/handle it as they see fit
    if (this.httpClient !== undefined) {
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

  async fetchWithTimeout(
    url: string,
    options: Record<string, any> | RequestInit | undefined,
    timeout: HttpRequests["requestTimeout"],
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const fetchFn = this.httpClient ? this.httpClient : fetch;

      const fetchPromise = fetchFn(url, options);

      const promises: Array<Promise<any>> = [fetchPromise];

      // TimeoutPromise will not run if undefined or zero
      let timeoutId: ReturnType<typeof setTimeout>;
      if (timeout) {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Error: Request Timed Out"));
          }, timeout);
        });

        promises.push(timeoutPromise);
      }

      Promise.race(promises)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          clearTimeout(timeoutId);
        });
    });
  }

  async get(
    url: string,
    params?: { [key: string]: any },
    config?: Record<string, any>,
  ): Promise<void>;

  async get<T = any>(
    url: string,
    params?: { [key: string]: any },
    config?: Record<string, any>,
  ): Promise<T>;

  async get(
    url: string,
    params?: { [key: string]: any },
    config?: Record<string, any>,
  ): Promise<any> {
    return await this.request({
      method: "GET",
      url,
      params,
      config,
    });
  }

  async post<T = any, R = EnqueuedTaskObject>(
    url: string,
    data?: T,
    params?: { [key: string]: any },
    config?: Record<string, any>,
  ): Promise<R>;

  async post(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>,
  ): Promise<any> {
    return await this.request({
      method: "POST",
      url,
      body: data,
      params,
      config,
    });
  }

  async put<T = any, R = EnqueuedTaskObject>(
    url: string,
    data?: T,
    params?: { [key: string]: any },
    config?: Record<string, any>,
  ): Promise<R>;

  async put(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>,
  ): Promise<any> {
    return await this.request({
      method: "PUT",
      url,
      body: data,
      params,
      config,
    });
  }

  async patch(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>,
  ): Promise<any> {
    return await this.request({
      method: "PATCH",
      url,
      body: data,
      params,
      config,
    });
  }

  async delete(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>,
  ): Promise<EnqueuedTaskObject>;
  async delete<T>(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>,
  ): Promise<T>;
  async delete(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>,
  ): Promise<any> {
    return await this.request({
      method: "DELETE",
      url,
      body: data,
      params,
      config,
    });
  }
}

export { HttpRequests, toQueryParams };
