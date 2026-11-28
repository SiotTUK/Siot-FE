import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { login } from '@/features/auth/api'
import { koreaToday } from '@/shared/i18n/format'
import { fetchEventCollectionStatus, fetchEvents } from './api'
import { defaultEventFilters } from './event-filters'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'
let requested: string[] = []

beforeEach(() => {
  requested = []
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' })
  vi.stubGlobal('fetch', (path: string, init?: RequestInit) => {
    const url = new URL(path, origin)
    requested.push(url.pathname + url.search)
    return interceptedFetch(url, init)
  })
})

afterEach(() => vi.unstubAllGlobals())

const signIn = () => login({ email: 'taken@example.com', password: 'abcd1234' })

it('sends the chosen sort for ongoing events', async () => {
  await signIn()
  const today = koreaToday()
  await fetchEvents(0, { ...defaultEventFilters, sort: 'LATEST' }, today)
  expect(requested.at(-1)).toBe(`/api/events?page=0&to=${today}&sort=LATEST`)
})

it('keeps the DATE order where scheduled events are split out of it', async () => {
  await signIn()
  requested = []
  const page = await fetchEvents(
    0,
    { ...defaultEventFilters, status: 'scheduled', sort: 'DEADLINE' },
    koreaToday(),
  )
  expect(requested.length).toBeGreaterThan(0)
  for (const url of requested) expect(url).not.toContain('sort=')
  expect(page.content.length).toBeGreaterThan(0)
})

it('reads the last collection time', async () => {
  await signIn()
  const status = await fetchEventCollectionStatus()
  expect(status.lastUpdatedAt).toBe(`${koreaToday()}T03:00:00+09:00`)
  expect(status.sources.map(({ source }) => source)).toEqual([
    'GGC',
    'FESTIVAL_STD',
    'TOURAPI',
  ])
})
