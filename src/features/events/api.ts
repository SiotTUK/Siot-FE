import { apiRequest } from '@/shared/api/client'
import type { Language, PageResponse } from '@/shared/api/types'

export interface EventSummary {
  eventId: number
  title: string
  venue: string | null
  thumbnailUrl?: string | null
  startsOn: string | null
  endsOn: string | null
  startsAt: string | null
  endsAt: string | null
  timeUnknown: boolean
  region: string | null
  multicultural: boolean
  language: Language
  translated: boolean
}

export interface EventDetail extends EventSummary {
  description: string | null
  priceInfo: string | null
  applicationDeadline: string | null
  applicationUrl: string | null
  sourceUrl: string | null
  subscribed: boolean
}

export interface EventRecommendation {
  event: EventSummary
  reasons: string[]
}

export const eventKeys = {
  all: ['events'] as const,
  member: (memberId: number) => [...eventKeys.all, memberId] as const,
  recommendations: (memberId: number) =>
    [...eventKeys.member(memberId), 'recommendations'] as const,
  list: (memberId: number, page: number) =>
    [...eventKeys.member(memberId), 'list', page] as const,
  detail: (memberId: number, eventId: string) =>
    [...eventKeys.member(memberId), 'detail', eventId] as const,
}

// The server localizes response text using the signed-in member's language.
export function fetchEventRecommendations(signal?: AbortSignal) {
  return apiRequest<EventRecommendation[]>('/api/events/recommendations', {
    signal,
  })
}

export function fetchEvents(page: number, signal?: AbortSignal) {
  return apiRequest<PageResponse<EventSummary>>(`/api/events?page=${page}`, {
    signal,
  })
}

export function fetchEventDetail(eventId: string, signal?: AbortSignal) {
  return apiRequest<EventDetail>(`/api/events/${eventId}`, { signal })
}
