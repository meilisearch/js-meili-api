import {
  MSApiError,
  MeiliSearchApiErrorResponse,
  MSApiErrorConstructor,
} from '../types'

const MeiliSearchApiError: MSApiErrorConstructor = class
  extends Error
  implements MSApiError {
  httpStatus: number
  response?: MeiliSearchApiErrorResponse
  errorCode?: string
  errorType?: string
  errorLink?: string
  stack?: string
  type: string

  constructor(error: MSApiError, status: number) {
    super(error.message)
    this.type = 'MeiliSearchApiError'
    this.name = 'MeiliSearchApiError'

    this.errorCode = error.errorCode
    this.errorType = error.errorType
    this.errorLink = error.errorLink
    this.message = error.message
    this.httpStatus = status
    if (error.stack) {
      this.stack = error.stack;
      this.stack = this.stack?.replace(/(TypeError|FetchError)/, this.name)
      this.stack = this.stack?.replace(
        'Failed to fetch',
        `request to ${error.errorLink} failed, reason: connect ECONNREFUSED`
      )
    } else {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, MeiliSearchApiError)
      }
    }
  }
}
export { MeiliSearchApiError }
