import { apiRequest } from '@/shared/api/client'
import type { Language, PageResponse } from '@/shared/api/types'

export const eventStatuses = ['ACTIVE', 'DELETED'] as const
export const eventRegions = ['SIHEUNG', 'GYEONGGI'] as const
export const eventSources = [
  'GGC',
  'FESTIVAL_STD',
  'TOURAPI',
  'MANUAL',
] as const
export const eventCategories = [
  'FESTIVAL',
  'PERFORMANCE',
  'EXHIBITION',
  'EDUCATION',
  'EVENT',
] as const

export type EventStatus = (typeof eventStatuses)[number]
export type EventRegion = (typeof eventRegions)[number]
export type EventSource = (typeof eventSources)[number]
export type EventCategory = (typeof eventCategories)[number]

/** ADM-05 list row (`GET /api/admin/events`), Korean text. */
export interface AdminEventSummary {
  eventId: number
  title: string
  startsOn: string | null
  endsOn: string | null
  region: EventRegion | null
  source: EventSource
  externalId: string | null
  status: EventStatus
  multicultural: boolean
  category: EventCategory
  revision: number
  updatedAt: string
  thumbnailUrl: string | null
}

/** Request field names the admin changed; collection no longer overwrites them. */
export type EventField =
  | 'title'
  | 'description'
  | 'venue'
  | 'startsOn'
  | 'endsOn'
  | 'startsAt'
  | 'endsAt'
  | 'priceInfo'
  | 'applicationDeadline'
  | 'applicationUrl'
  | 'sourceUrl'
  | 'region'
  | 'multicultural'
  | 'category'
  | 'thumbnailUrl'

/** ADM-05 `GET /api/admin/events/{id}` (deleted events too), Korean text. */
export interface AdminEventDetail {
  eventId: number
  title: string
  description: string | null
  venue: string | null
  startsOn: string | null
  endsOn: string | null
  /** HH:mm or HH:mm:ss */
  startsAt: string | null
  endsAt: string | null
  timeUnknown: boolean
  priceInfo: string | null
  /** ISO date-time with offset. */
  applicationDeadline: string | null
  applicationUrl: string | null
  sourceUrl: string | null
  region: EventRegion | null
  multicultural: boolean
  category: EventCategory
  source: EventSource
  externalId: string | null
  status: EventStatus
  revision: number
  lockedFields: EventField[]
  tags: string[]
  /** Languages translated from the current text (ko included). */
  translatedLanguages: Language[]
  createdAt: string
  updatedAt: string
  thumbnailUrl: string | null
}

/** EVE-07 (Korean). One of startsOn/endsOn is required. */
export interface AdminEventCreateRequest {
  title: string
  description: string | null
  venue: string | null
  startsOn: string | null
  endsOn: string | null
  startsAt: string | null
  endsAt: string | null
  priceInfo: string | null
  applicationDeadline: string | null
  applicationUrl: string | null
  sourceUrl: string | null
  region: EventRegion
  /** null → decided from title/description keywords. */
  multicultural: boolean | null
  /** null → EVENT. */
  category: EventCategory | null
  thumbnailUrl: string | null
}

/**
 * EVE-08: only the fields sent change, and each sent field is locked against
 * collection. Text fields accept "" to clear; dates and times cannot be cleared.
 */
export type AdminEventUpdateRequest = Partial<{
  title: string
  description: string
  venue: string
  startsOn: string
  endsOn: string
  startsAt: string
  endsAt: string
  priceInfo: string
  applicationDeadline: string
  applicationUrl: string
  sourceUrl: string
  region: EventRegion
  multicultural: boolean
  category: EventCategory
  thumbnailUrl: string
}>

/** One source of `POST /api/admin/events/collect`. */
export interface EventCollectionRun {
  runId: number
  source: 'GGC' | 'FESTIVAL_STD' | 'TOURAPI'
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED'
  startedAt: string
  finishedAt: string | null
  fetchedCount: number
  upsertedCount: number
  error: string | null
}

export interface AdminEventFilters {
  status: EventStatus | ''
  region: EventRegion | ''
  source: EventSource | ''
  category: EventCategory | ''
  title: string
}

export const adminEventKeys = {
  all: ['admin', 'events'] as const,
  list: (filters: AdminEventFilters) =>
    [...adminEventKeys.all, 'list', filters] as const,
  detail: (eventId: number) =>
    [...adminEventKeys.all, 'detail', eventId] as const,
}

export function fetchAdminEvents(filters: AdminEventFilters, page: number) {
  const search = new URLSearchParams({ page: String(page), size: '20' })
  for (const key of ['status', 'region', 'source', 'category'] as const)
    if (filters[key]) search.set(key, filters[key])
  if (filters.title.trim()) search.set('title', filters.title.trim())
  return apiRequest<PageResponse<AdminEventSummary>>(
    `/api/admin/events?${search.toString()}`,
  )
}

export function fetchAdminEvent(eventId: number) {
  return apiRequest<AdminEventDetail>(`/api/admin/events/${eventId}`)
}

/**
 * 409 DUPLICATE_EVENT (`details.eventIds`) when a similar active event
 * exists; send again with `force` after the admin confirms.
 */
export function createAdminEvent(body: AdminEventCreateRequest, force = false) {
  return apiRequest<AdminEventDetail>(
    `/api/admin/events${force ? '?force=true' : ''}`,
    { method: 'POST', body },
  )
}

export function updateAdminEvent(
  eventId: number,
  body: AdminEventUpdateRequest,
) {
  return apiRequest<AdminEventDetail>(`/api/admin/events/${eventId}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteAdminEvent(eventId: number) {
  return apiRequest(`/api/admin/events/${eventId}`, { method: 'DELETE' })
}

/** Runs the daily collection now. 409 EVENT_COLLECTION_RUNNING if busy. */
export function collectEvents() {
  return apiRequest<EventCollectionRun[]>('/api/admin/events/collect', {
    method: 'POST',
  })
}
