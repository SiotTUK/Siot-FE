import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login, logout } from '@/features/auth/api'
import {
  collectEvents,
  createAdminEvent,
  deleteAdminEvent,
  fetchAdminEvent,
  fetchAdminEvents,
  updateAdminEvent,
  type AdminEventCreateRequest,
  type AdminEventFilters,
} from './event-api'

// Contract tests against the MSW mock (not the real BE).
const origin = 'http://localhost'
const admin = { email: 'admin@example.com', password: 'admin1234' }
const member = { email: 'taken@example.com', password: 'abcd1234' }
const all: AdminEventFilters = {
  status: '',
  region: '',
  source: '',
  category: '',
  title: '',
}

beforeEach(() => {
  const interceptedFetch = globalThis.fetch
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' })
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) =>
      interceptedFetch(
        typeof input === 'string' ? new URL(input, origin) : input,
        init,
      ),
    ),
  )
})
afterEach(() => vi.unstubAllGlobals())

const newEvent: AdminEventCreateRequest = {
  title: '2026 외국인 주민 한국어 교실',
  description: null,
  venue: '시흥시 외국인복지센터',
  startsOn: '2026-12-18',
  endsOn: null,
  startsAt: '14:00',
  endsAt: '16:00',
  priceInfo: '무료',
  applicationDeadline: '2026-12-10T18:00:00+09:00',
  applicationUrl: null,
  sourceUrl: null,
  region: 'SIHEUNG',
  multicultural: null,
  category: 'EDUCATION',
  thumbnailUrl: null,
}

describe('ADM-05 admin events', () => {
  it('is for admins only', async () => {
    await login(member)
    await expect(fetchAdminEvents(all, 0)).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })
    await expect(collectEvents()).rejects.toMatchObject({ status: 403 })
    await logout()
  })

  it('creates, warns about duplicates, forces, edits with locks and deletes', async () => {
    await login(admin)
    const created = await createAdminEvent(newEvent)
    expect(created).toMatchObject({
      source: 'MANUAL',
      endsOn: '2026-12-18',
      multicultural: true,
      translatedLanguages: ['ko'],
    })

    // Same title ignoring the year, same start date, same venue.
    const duplicate = { ...newEvent, title: '외국인 주민 한국어 교실 (2회)' }
    await expect(createAdminEvent(duplicate)).rejects.toMatchObject({
      status: 409,
      code: 'DUPLICATE_EVENT',
      details: { eventIds: [created.eventId] },
    })
    const forced = await createAdminEvent(duplicate, true)
    expect(forced.eventId).not.toBe(created.eventId)

    const updated = await updateAdminEvent(created.eventId, {
      venue: '',
      startsOn: '2026-12-17',
    })
    expect(updated).toMatchObject({
      venue: null,
      startsOn: '2026-12-17',
      revision: 2,
    })
    expect(updated.lockedFields).toEqual(
      expect.arrayContaining(['venue', 'startsOn']),
    )
    await expect(
      updateAdminEvent(created.eventId, { endsOn: '2026-12-01' }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_INPUT' })
    await expect(
      updateAdminEvent(created.eventId, { sourceUrl: 'www.a.kr' }),
    ).rejects.toMatchObject({ status: 400 })

    const manual = await fetchAdminEvents({ ...all, source: 'MANUAL' }, 0)
    expect(manual.content.map((event) => event.eventId)).toEqual(
      expect.arrayContaining([created.eventId, forced.eventId]),
    )

    await deleteAdminEvent(forced.eventId)
    await expect(fetchAdminEvent(forced.eventId)).resolves.toMatchObject({
      status: 'DELETED',
    })
    const active = await fetchAdminEvents(
      { ...all, status: 'ACTIVE', source: 'MANUAL' },
      0,
    )
    expect(active.content.map((event) => event.eventId)).not.toContain(
      forced.eventId,
    )
    await expect(fetchAdminEvent(99999)).rejects.toMatchObject({
      status: 404,
      code: 'EVENT_NOT_FOUND',
    })
  })

  it('rejects an event without dates or region', async () => {
    await login(admin)
    await expect(
      createAdminEvent({ ...newEvent, startsOn: null, endsOn: null }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_INPUT' })
  })

  it('runs the collection and returns one result per source', async () => {
    await login(admin)
    const runs = await collectEvents()
    expect(runs.map((run) => run.source)).toEqual([
      'GGC',
      'FESTIVAL_STD',
      'TOURAPI',
    ])
  })
})
