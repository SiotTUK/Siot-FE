import type { ApiResponse, ErrorResponse } from './types'

type ApiPath = `/api/${string}`
type RequestOptions = Omit<RequestInit, 'body' | 'credentials'> & {
  body?: unknown
  isRequestCurrent?: () => boolean
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Record<string, unknown>

  constructor(status: number, error: ErrorResponse) {
    super(error.message)
    this.name = 'ApiError'
    this.status = status
    this.code = error.code
    this.details = error.details
  }
}

export function readCookie(
  name: string,
  cookie = document.cookie,
): string | undefined {
  const entry = cookie
    .split(';')
    .find((part) => part.trim().startsWith(`${name}=`))
  if (!entry) return undefined
  try {
    return decodeURIComponent(entry.trim().slice(name.length + 1))
  } catch {
    return undefined
  }
}

async function responseError(response: Response): Promise<ApiError> {
  try {
    const body: unknown = await response.json()
    if (
      body &&
      typeof body === 'object' &&
      'code' in body &&
      typeof body.code === 'string' &&
      'message' in body &&
      typeof body.message === 'string'
    )
      return new ApiError(response.status, {
        code: body.code,
        message: body.message,
        details:
          'details' in body &&
          body.details &&
          typeof body.details === 'object' &&
          !Array.isArray(body.details)
            ? (body.details as Record<string, unknown>)
            : undefined,
      })
  } catch {
    /* A proxy may return a non-JSON error page. */
  }
  return new ApiError(response.status, {
    code: 'HTTP_ERROR',
    message: response.statusText || 'Request failed',
  })
}

let csrfRequest: Promise<void> | undefined

export async function refreshCsrf(): Promise<void> {
  csrfRequest ??= fetch('/api/auth/csrf', { credentials: 'include' })
    .then(async (response) => {
      if (!response.ok) throw await responseError(response)
    })
    .finally(() => {
      csrfRequest = undefined
    })
  await csrfRequest
}

/** Same-origin /api requests. Cookie sessions remain HttpOnly; never store passwords or tokens. */
export async function apiRequest<T = undefined>(
  path: ApiPath,
  { body, isRequestCurrent, ...options }: RequestOptions = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const changesState = !['GET', 'HEAD', 'OPTIONS'].includes(method)

  const assertRequestCurrent = () => {
    if (isRequestCurrent && !isRequestCurrent())
      throw new DOMException('The request session has ended', 'AbortError')
  }

  const send = async () => {
    assertRequestCurrent()
    const headers = new Headers(options.headers)
    headers.set('Accept', 'application/json')
    if (body !== undefined) headers.set('Content-Type', 'application/json')
    if (changesState) {
      const token = readCookie('XSRF-TOKEN')
      if (!token)
        throw new ApiError(403, {
          code: 'CSRF_TOKEN_INVALID',
          message: 'CSRF cookie is missing',
        })
      headers.set('X-XSRF-TOKEN', token)
    }
    return fetch(path, {
      ...options,
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }

  if (changesState && !readCookie('XSRF-TOKEN')) {
    assertRequestCurrent()
    await refreshCsrf()
  }
  let response = await send()
  if (changesState && response.status === 403) {
    const error = await responseError(response.clone())
    // Only retry requests explicitly rejected by CSRF protection, never arbitrary mutations.
    if (error.code === 'CSRF_TOKEN_INVALID') {
      assertRequestCurrent()
      await refreshCsrf()
      response = await send()
    }
  }
  if (!response.ok) throw await responseError(response)
  if (response.status === 204) return undefined as T
  // 202 Accepted (e.g. password reset) may come without a body.
  const text = await response.text()
  if (!text) return undefined as T
  const payload = JSON.parse(text) as ApiResponse<T>
  return payload.data
}
