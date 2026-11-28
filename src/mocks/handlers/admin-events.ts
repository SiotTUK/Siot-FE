import { http, HttpResponse } from 'msw'
import {
  eventCategories,
  eventRegions,
  type AdminEventDetail,
  type AdminEventSummary,
  type EventCollectionRun,
  type EventField,
} from '@/features/admin/event-api'
import { body, error, page, persist, state } from '../db'
import { requireAdmin } from './admin'
import { mockEvents } from './events'

/**
 * ADM-05·EVE-07~09 admin event APIs over a mutable copy of the event mock.
 * Dev/test only. The members' event handlers keep serving the fixed copy, so
 * changes here do not show on the member screens in the mock.
 */
function data(): NonNullable<typeof state.adminEvents> {
  state.adminEvents ??= {
    events: mockEvents('ko').map((event) => ({
      eventId: event.eventId,
      title: event.title,
      description: event.description,
      venue: event.venue,
      startsOn: event.startsOn,
      endsOn: event.endsOn,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      timeUnknown: event.timeUnknown,
      priceInfo: event.priceInfo,
      applicationDeadline: event.applicationDeadline
        ? `${event.applicationDeadline}T18:00:00+09:00`
        : null,
      applicationUrl: event.applicationUrl,
      sourceUrl: event.sourceUrl,
      region: event.region as AdminEventDetail['region'],
      multicultural: event.multicultural,
      category: event.category,
      source: 'GGC',
      externalId: `GGC-${event.eventId}`,
      status: 'ACTIVE',
      revision: 1,
      lockedFields: [],
      tags: [],
      translatedLanguages: ['ko', 'en', 'zh', 'vi'],
      createdAt: '2026-11-01T03:00:00+09:00',
      updatedAt: '2026-11-01T03:00:00+09:00',
      thumbnailUrl: event.thumbnailUrl,
    })),
    nextId: 1000,
  }
  return state.adminEvents
}

const notFound = () => error(404, 'EVENT_NOT_FOUND', '행사를 찾을 수 없습니다.')
const invalid = (message = '요청 값이 올바르지 않습니다.') =>
  error(400, 'INVALID_INPUT', message)
const urlPattern = /^https?:\/\/\S+$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^\d{2}:\d{2}(:\d{2})?$/
const clean = (value: string) => value.trim() || null

function summary(event: AdminEventDetail): AdminEventSummary {
  const {
    eventId,
    title,
    startsOn,
    endsOn,
    region,
    source,
    externalId,
    status,
    multicultural,
    category,
    revision,
    updatedAt,
    thumbnailUrl,
  } = event
  return {
    eventId,
    title,
    startsOn,
    endsOn,
    region,
    source,
    externalId,
    status,
    multicultural,
    category,
    revision,
    updatedAt,
    thumbnailUrl,
  }
}

/** Shape checks shared by create and update (subset of the BE rules). */
function badInput(input: Record<string, unknown>, create: boolean) {
  const str = (key: string, max: number) =>
    input[key] != null &&
    (typeof input[key] !== 'string' || (input[key] as string).length > max)
  const link = (key: string) =>
    typeof input[key] === 'string' &&
    input[key] !== '' &&
    !urlPattern.test(input[key] as string)
  if (create && (typeof input.title !== 'string' || !input.title.trim()))
    return true
  if (
    str('title', 255) ||
    str('description', 10000) ||
    str('venue', 255) ||
    str('priceInfo', 1000)
  )
    return true
  if (['applicationUrl', 'sourceUrl', 'thumbnailUrl'].some(link)) return true
  if (
    ['startsOn', 'endsOn'].some(
      (key) => input[key] != null && !datePattern.test(String(input[key])),
    ) ||
    ['startsAt', 'endsAt'].some(
      (key) => input[key] != null && !timePattern.test(String(input[key])),
    )
  )
    return true
  if (input.region != null && !eventRegions.includes(input.region as never))
    return true
  if (create && input.region == null) return true
  return (
    input.category != null && !eventCategories.includes(input.category as never)
  )
}

function dateIssue(startsOn: string | null, endsOn: string | null) {
  if (!startsOn && !endsOn) return '시작일과 종료일 중 하나는 입력해 주세요.'
  if (startsOn && endsOn && startsOn > endsOn)
    return '시작일은 종료일보다 늦을 수 없습니다.'
  return undefined
}

/** BE: same title (ignoring years, numbers, symbols), start date, venue or blank. */
const titleKey = (title: string) =>
  title.replace(/\d+\s*(회|차|번째)?|[^\p{L}]/gu, '').toLowerCase()

let runId = 100

export const adminEventHandlers = [
  http.get('*/api/admin/events', ({ request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const url = new URL(request.url)
    const get = (key: string) => url.searchParams.get(key) ?? ''
    const title = get('title').trim()
    const rows = [...data().events]
      .filter((event) => !get('status') || event.status === get('status'))
      .filter((event) => !get('region') || event.region === get('region'))
      .filter((event) => !get('source') || event.source === get('source'))
      .filter((event) => !get('category') || event.category === get('category'))
      .filter((event) => !title || event.title.includes(title))
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || b.eventId - a.eventId,
      )
      .map(summary)
    return HttpResponse.json({ data: page(rows, url) })
  }),

  http.get('*/api/admin/events/:eventId', ({ params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const event = data().events.find(
      (item) => item.eventId === Number(params.eventId),
    )
    return event ? HttpResponse.json({ data: event }) : notFound()
  }),

  http.post('*/api/admin/events', async ({ request }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const input = await body(request)
    if (badInput(input, true)) return invalid()
    const startsOn = (input.startsOn as string | null) ?? null
    const endsOn = (input.endsOn as string | null) ?? startsOn
    const issue = dateIssue(startsOn, endsOn)
    if (issue) return invalid(issue)
    const title = String(input.title).trim()
    const venue = typeof input.venue === 'string' ? clean(input.venue) : null
    const store = data()
    const force = new URL(request.url).searchParams.get('force') === 'true'
    const duplicates = store.events.filter(
      (event) =>
        event.status === 'ACTIVE' &&
        titleKey(event.title) === titleKey(title) &&
        event.startsOn === startsOn &&
        (!event.venue || !venue || event.venue === venue),
    )
    if (duplicates.length > 0 && !force)
      return error(
        409,
        'DUPLICATE_EVENT',
        '행사명·시작일·장소가 같은 행사가 이미 있습니다. 그래도 등록하려면 force=true 로 다시 요청해 주세요.',
        { eventIds: duplicates.map((event) => event.eventId) },
      )
    const now = new Date().toISOString()
    const startsAt = (input.startsAt as string | null) ?? null
    const endsAt = (input.endsAt as string | null) ?? null
    const event: AdminEventDetail = {
      eventId: store.nextId++,
      title,
      description:
        typeof input.description === 'string' ? clean(input.description) : null,
      venue,
      startsOn,
      endsOn,
      startsAt,
      endsAt,
      timeUnknown: !startsAt && !endsAt,
      priceInfo:
        typeof input.priceInfo === 'string' ? clean(input.priceInfo) : null,
      applicationDeadline: (input.applicationDeadline as string | null) ?? null,
      applicationUrl: (input.applicationUrl as string | null) ?? null,
      sourceUrl: (input.sourceUrl as string | null) ?? null,
      region: input.region as AdminEventDetail['region'],
      multicultural:
        typeof input.multicultural === 'boolean'
          ? input.multicultural
          : /다문화|외국인/.test(title),
      category: (input.category as AdminEventDetail['category']) ?? 'EVENT',
      source: 'MANUAL',
      externalId: null,
      status: 'ACTIVE',
      revision: 1,
      lockedFields: [],
      tags: [],
      // Translation runs after saving.
      translatedLanguages: ['ko'],
      createdAt: now,
      updatedAt: now,
      thumbnailUrl: (input.thumbnailUrl as string | null) ?? null,
    }
    store.events.push(event)
    persist()
    return HttpResponse.json({ data: event }, { status: 201 })
  }),

  http.patch('*/api/admin/events/:eventId', async ({ request, params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const event = data().events.find(
      (item) => item.eventId === Number(params.eventId),
    )
    if (!event) return notFound()
    const input = await body(request)
    if (badInput(input, false)) return invalid()
    if (typeof input.title === 'string' && !input.title.trim())
      return invalid('행사명을 비울 수 없습니다.')
    const next = { ...event }
    const sent = Object.keys(input).filter(
      (key) => input[key] != null,
    ) as EventField[]
    for (const field of sent) {
      const value = input[field]
      ;(next as Record<string, unknown>)[field] =
        typeof value === 'string' &&
        ![
          'startsOn',
          'endsOn',
          'startsAt',
          'endsAt',
          'region',
          'category',
        ].includes(field)
          ? clean(value)
          : value
    }
    const issue = dateIssue(next.startsOn, next.endsOn)
    if (issue) return invalid(issue)
    // Every field sent is locked against collection; text changes bump the revision.
    next.lockedFields = [...new Set([...event.lockedFields, ...sent])]
    if (
      sent.some((field) => field !== 'category' && field !== 'thumbnailUrl')
    ) {
      next.revision = event.revision + 1
      next.translatedLanguages = ['ko']
    }
    next.updatedAt = new Date().toISOString()
    Object.assign(event, next)
    persist()
    return HttpResponse.json({ data: event })
  }),

  http.delete('*/api/admin/events/:eventId', ({ params }) => {
    const denied = requireAdmin()
    if (denied) return denied
    const event = data().events.find(
      (item) => item.eventId === Number(params.eventId),
    )
    if (!event) return notFound()
    event.status = 'DELETED'
    event.updatedAt = new Date().toISOString()
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/api/admin/events/collect', () => {
    const denied = requireAdmin()
    if (denied) return denied
    const now = new Date().toISOString()
    const runs: EventCollectionRun[] = (
      ['GGC', 'FESTIVAL_STD', 'TOURAPI'] as const
    ).map((source) => ({
      runId: runId++,
      source,
      status: 'SUCCEEDED',
      startedAt: now,
      finishedAt: now,
      fetchedCount: 12,
      upsertedCount: 0,
      error: null,
    }))
    return HttpResponse.json({ data: runs })
  }),
]
