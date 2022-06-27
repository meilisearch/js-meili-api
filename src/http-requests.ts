import 'cross-fetch/polyfill'

import { Config, EnqueuedTask } from './types'
import { PACKAGE_VERSION } from './package-version'

import {
  MeiliSearchError,
  httpResponseErrorHandler,
  httpErrorHandler,
} from './errors'

import { addTrailingSlash, addProtocolIfNotPresent } from './utils'

function constructHostURL(host: string): string {
  try {
    host = addProtocolIfNotPresent(host)
    host = addTrailingSlash(host)
    return host
  } catch (e) {
    throw new MeiliSearchError('The provided host is not valid.')
  }
}

function createHeaders(config: Config): Record<string, any> {
  config.headers = config.headers || {}
  const clientHeader = 'X-Meilisearch-Client'
  const contentType = 'Content-Type'

  const defaultHeaders = {
    [clientHeader]: `Meilisearch JavaScript (v${PACKAGE_VERSION})`,
    [contentType]: 'application/json',
  }
  const headers: Record<string, any> = {}

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }

  // Creates the custom user agent with information on the package used.
  if (
    config.headers[clientHeader] &&
    Array.isArray(config.headers[clientHeader])
  ) {
    const clients = config.headers[clientHeader].concat(
      defaultHeaders[clientHeader]
    )

    headers[clientHeader] = clients.join(' ; ')
  } else if (
    config.headers[clientHeader] &&
    !Array.isArray(config.headers[clientHeader])
  ) {
    // If the header is defined but not an array
    throw new MeiliSearchError(
      `Meilisearch: The header "${clientHeader}" should be an array of string(s).\n`
    )
  }

  return { ...defaultHeaders, ...headers }
}

class HttpRequests {
  headers: Record<string, any>
  url: URL

  constructor(config: Config) {
    this.headers = createHeaders(config)

    try {
      const host = constructHostURL(config.host)
      this.url = new URL(host)
    } catch (e) {
      throw new MeiliSearchError('The provided host is not valid.')
    }
  }

  async request({
    method,
    url,
    params,
    body,
    config,
  }: {
    method: string
    url: string
    params?: { [key: string]: any }
    body?: any
    config?: Record<string, any>
  }) {
    const constructURL = new URL(url, this.url)
    if (params) {
      const queryParams = new URLSearchParams()
      Object.keys(params)
        .filter((x: string) => params[x] !== null)
        .map((x: string) => queryParams.set(x, params[x]))
      constructURL.search = queryParams.toString()
    }

    try {
      const response: any = await fetch(constructURL.toString(), {
        ...config,
        method,
        body: JSON.stringify(body),
        headers: this.headers,
      }).then((res) => httpResponseErrorHandler(res))
      const parsedBody = await response.json().catch(() => undefined)

      return parsedBody
    } catch (e: any) {
      const stack = e.stack
      httpErrorHandler(e, stack, constructURL.toString())
    }
  }

  async get(
    url: string,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<void>

  async get<T = any>(
    url: string,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<T>

  async get(
    url: string,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<any> {
    return await this.request({
      method: 'GET',
      url,
      params,
      config,
    })
  }

  async post<T = any, R = EnqueuedTask>(
    url: string,
    data?: T,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<R>

  async post(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<any> {
    return await this.request({
      method: 'POST',
      url,
      body: data,
      params,
      config,
    })
  }

  async put<T = any, R = EnqueuedTask>(
    url: string,
    data?: T,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<R>

  async put(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<any> {
    return await this.request({
      method: 'PUT',
      url,
      body: data,
      params,
      config,
    })
  }

  async patch(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<any> {
    return await this.request({
      method: 'PATCH',
      url,
      body: data,
      params,
      config,
    })
  }

  async delete(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<EnqueuedTask>
  async delete<T>(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<T>
  async delete(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<any> {
    return await this.request({
      method: 'DELETE',
      url,
      body: data,
      params,
      config,
    })
  }
}

export { HttpRequests }
