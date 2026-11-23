import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/setup'
import { apiRequest, readCookie } from './client'

const origin = 'http://localhost'

afterEach(() => vi.unstubAllGlobals())

function browserEnvironment(cookie = '') {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie })
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? new URL(input, origin) : input
      return interceptedFetch(url, init)
    }),
  )
}

describe('API client contract', () => {
  it.each([
    ['  NEW.User@Example.COM  ', 'new.user@example.com', true],
    ['TAKEN@example.com', 'taken@example.com', false],
  ])(
    'uses the email availability contract for %s',
    async (input, email, available) => {
      browserEnvironment()
      await expect(
        apiRequest(
          `/api/auth/email/availability?email=${encodeURIComponent(input)}`,
        ),
      ).resolves.toEqual({ email, available })
    },
  )

  it.each(['invalid', 'user@-example.com', `${'a'.repeat(244)}@example.com`])(
    'preserves EMAIL_FORMAT for invalid email %s',
    async (email) => {
      browserEnvironment()
      await expect(
        apiRequest(
          `/api/auth/email/availability?email=${encodeURIComponent(email)}`,
        ),
      ).rejects.toMatchObject({ status: 400, code: 'EMAIL_FORMAT' })
    },
  )

  it('unwraps data and sends credentials', async () => {
    browserEnvironment()
    server.use(
      http.get(`${origin}/api/test`, () => {
        return HttpResponse.json({ data: { id: 1 } })
      }),
    )
    await expect(apiRequest('/api/test')).resolves.toEqual({ id: 1 })
    expect(fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('preserves LOGIN_FAILED instead of treating it as session expiration', async () => {
    browserEnvironment('XSRF-TOKEN=token')
    server.use(
      http.post(`${origin}/api/auth/login`, () =>
        HttpResponse.json(
          {
            code: 'LOGIN_FAILED',
            message: '이메일 또는 비밀번호가 맞지 않습니다.',
          },
          { status: 401 },
        ),
      ),
    )
    await expect(
      apiRequest('/api/auth/login', { method: 'POST', body: {} }),
    ).rejects.toMatchObject({ status: 401, code: 'LOGIN_FAILED' })
  })

  it('refreshes CSRF on rejection, retries once and accepts a 204 response', async () => {
    browserEnvironment('XSRF-TOKEN=old-token')
    let calls = 0
    server.use(
      http.get(`${origin}/api/auth/csrf`, () => {
        document.cookie = 'XSRF-TOKEN=new-token'
        return new HttpResponse(null, { status: 204 })
      }),
      http.post(`${origin}/api/test`, ({ request }) => {
        calls += 1
        if (calls === 1)
          return HttpResponse.json(
            { code: 'CSRF_TOKEN_INVALID', message: 'Expired' },
            { status: 403 },
          )
        expect(request.headers.get('X-XSRF-TOKEN')).toBe('new-token')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await expect(
      apiRequest('/api/test', { method: 'POST', isRequestCurrent: () => true }),
    ).resolves.toBeUndefined()
    expect(calls).toBe(2)
  })

  it('cancels a guarded write if its session ends during CSRF refresh', async () => {
    browserEnvironment('XSRF-TOKEN=old-token')
    let isCurrent = true
    const write = vi.fn(() =>
      HttpResponse.json(
        { code: 'CSRF_TOKEN_INVALID', message: 'Expired' },
        { status: 403 },
      ),
    )
    server.use(
      http.post(`${origin}/api/test`, write),
      http.get(`${origin}/api/auth/csrf`, () => {
        document.cookie = 'XSRF-TOKEN=new-token'
        isCurrent = false
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await expect(
      apiRequest('/api/test', {
        method: 'POST',
        isRequestCurrent: () => isCurrent,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(write).toHaveBeenCalledTimes(1)
  })

  it('does not retry a mutation rejected for insufficient permissions', async () => {
    browserEnvironment('XSRF-TOKEN=token')
    let calls = 0
    server.use(
      http.post(`${origin}/api/test`, () => {
        calls += 1
        return HttpResponse.json(
          { code: 'FORBIDDEN', message: 'Forbidden' },
          { status: 403 },
        )
      }),
    )
    await expect(
      apiRequest('/api/test', { method: 'POST' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(calls).toBe(1)
  })

  it('normalizes a non-JSON gateway error', async () => {
    browserEnvironment()
    server.use(
      http.get(
        `${origin}/api/test`,
        () => new HttpResponse('<html>Bad Gateway</html>', { status: 502 }),
      ),
    )
    await expect(apiRequest('/api/test')).rejects.toMatchObject({
      status: 502,
      code: 'HTTP_ERROR',
    })
  })
})

describe('CSRF cookie parsing', () => {
  it('uses an exact cookie name and decodes the value', () => {
    expect(
      readCookie('XSRF-TOKEN', 'OTHER-XSRF-TOKEN=wrong; XSRF-TOKEN=a%3Db'),
    ).toBe('a=b')
  })
  it('handles absent or malformed values', () => {
    expect(readCookie('XSRF-TOKEN', '')).toBeUndefined()
    expect(readCookie('XSRF-TOKEN', 'XSRF-TOKEN=%')).toBeUndefined()
  })
})
