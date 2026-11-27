import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { login } from '@/features/auth/api'
import { server } from '@/test/setup'
import {
  fetchEventDetail,
  fetchEventSubscription,
  saveEventSubscription,
} from './api'

const origin = 'http://localhost'
const active = () => true

beforeEach(() => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' })
  vi.stubGlobal('fetch', (path: string, init?: RequestInit) =>
    interceptedFetch(new URL(path, origin), init),
  )
})

afterEach(() => vi.unstubAllGlobals())

it('shares the current subscription with event detail and retains it by member', async () => {
  await expect(fetchEventSubscription('2')).rejects.toMatchObject({
    status: 401,
  })
  const signIn = () =>
    login({ email: 'taken@example.com', password: 'abcd1234' })
  await signIn()
  expect(await fetchEventSubscription('2')).toEqual({
    subscribed: false,
    leadDays: null,
  })
  expect(await saveEventSubscription('2', 1, active)).toEqual({
    subscribed: true,
    leadDays: 1,
  })
  expect(await fetchEventDetail('2')).toMatchObject({ subscribed: true })
  expect(await saveEventSubscription('2', 7, active)).toEqual({
    subscribed: true,
    leadDays: 7,
  })
  await login({ email: 'admin@example.com', password: 'admin1234' })
  expect(await fetchEventSubscription('2')).toEqual({
    subscribed: false,
    leadDays: null,
  })
  await signIn()
  expect(await fetchEventSubscription('2')).toEqual({
    subscribed: true,
    leadDays: 7,
  })
  expect(await saveEventSubscription('2', null, active)).toEqual({
    subscribed: false,
    leadDays: null,
  })
  expect(await fetchEventDetail('2')).toMatchObject({ subscribed: false })
  await expect(saveEventSubscription('999', 1, active)).rejects.toMatchObject({
    code: 'EVENT_NOT_FOUND',
  })
})

it('rejects a CSRF retry after the member session changes', async () => {
  let current = true
  const reject = vi.fn(() =>
    HttpResponse.json(
      { code: 'CSRF_TOKEN_INVALID', message: 'CSRF' },
      { status: 403 },
    ),
  )
  server.use(
    http.post(`${origin}/api/events/2/subscriptions`, reject),
    http.get(`${origin}/api/auth/csrf`, () => {
      current = false
      return new HttpResponse(null, { status: 204 })
    }),
  )
  await expect(
    saveEventSubscription('2', 3, () => current),
  ).rejects.toMatchObject({ name: 'AbortError' })
  expect(reject).toHaveBeenCalledTimes(1)
})
