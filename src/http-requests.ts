import 'cross-fetch/polyfill'

import { Config, EnqueuedTaskObject } from './types'
import { PACKAGE_VERSION } from './package-version'

import {
  MeiliSearchError,
  httpResponseErrorHandler,
  httpErrorHandler,
} from './errors'

import { addTrailingSlash, addProtocolIfNotPresent } from './utils'

type queryParams<T> = { [key in keyof T]: string }

function toQueryParams<T extends object>(parameters: T): queryParams<T> {
  const params = Object.keys(parameters) as Array<keyof T>

  const queryParams = params.reduce<queryParams<T>>((acc, key) => {
    const value = parameters[key]
    if (value === undefined) {
      return acc
    } else if (Array.isArray(value)) {
      return { ...acc, [key]: value.join(',') }
    } else if (value instanceof Date) {
      return { ...acc, [key]: value.toISOString() }
    }
    return { ...acc, [key]: value }
  }, {} as queryParams<T>)
  return queryParams
}

function constructHostURL(host: string): string {
  try {
    host = addProtocolIfNotPresent(host)
    host = addTrailingSlash(host)
    return host
  } catch (e) {
    throw new MeiliSearchError('The provided host is not valid.')
  }
}

function hasHeader(headers: HeadersInit, headerName: string) {
  if (Array.isArray(headers)) {
    return headers.some((header) => header[0] === headerName)
  } else if ('has' in headers) {
    return (headers as Headers).has(headerName)
  }

  return !!headers[headerName]
}

function createHeaders(config: Config): Record<string, any> {
  const agentHeader = 'X-Meilisearch-Client'
  const packageAgent = `Meilisearch JavaScript (v${PACKAGE_VERSION})`
  const contentType = 'Content-Type'
  const configHeaders = config.requestConfig?.headers ?? {}

  const headers: Record<string, any> = Object.assign({}, configHeaders) // Create a hard copy and not a reference to config.headers

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }

  if (!hasHeader(configHeaders, contentType)) {
    headers['Content-Type'] = 'application/json'
  }

  // Creates the custom user agent with information on the package used.
  if (config.clientAgents && Array.isArray(config.clientAgents)) {
    const clients = config.clientAgents.concat(packageAgent)

    headers[agentHeader] = clients.join(' ; ')
  } else if (config.clientAgents && !Array.isArray(config.clientAgents)) {
    // If the header is defined but not an array
    throw new MeiliSearchError(
      `Meilisearch: The header "${agentHeader}" should be an array of string(s).\n`
    )
  } else {
    headers[agentHeader] = packageAgent
  }

  return headers
}

class HttpRequests {
  headers: Record<string, any>
  url: URL
  fetchConfig?: Config['requestConfig']
  httpClient?: Config['httpClient']

  constructor(config: Config) {
    this.headers = createHeaders(config)
    this.fetchConfig = config.requestConfig
    this.httpClient = config.httpClient

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
      const fetchFn = this.httpClient ? this.httpClient : fetch
      const _request = fetchFn(constructURL.toString(), {
        ...config,
        ...this.fetchConfig,
        method,
        body: JSON.stringify(body),
        headers: this.headers,
      })
      if (this.httpClient) {
        return await _request
      }
      const response = await _request.then((res: any) =>
        httpResponseErrorHandler(res)
      )
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

  async post<T = any, R = EnqueuedTaskObject>(
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

  async put<T = any, R = EnqueuedTaskObject>(
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
  ): Promise<EnqueuedTaskObject>
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

export { HttpRequests, toQueryParams }
