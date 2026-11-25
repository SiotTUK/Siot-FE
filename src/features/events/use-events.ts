import { useQuery } from '@tanstack/react-query'
import {
  eventKeys,
  fetchEventDetail,
  fetchEventRecommendations,
  fetchEvents,
} from './api'

export function useEventRecommendations(memberId: number) {
  return useQuery({
    queryKey: eventKeys.recommendations(memberId),
    queryFn: ({ signal }) => fetchEventRecommendations(signal),
  })
}

export function useEvents(memberId: number, page: number) {
  return useQuery({
    queryKey: eventKeys.list(memberId, page),
    queryFn: ({ signal }) => fetchEvents(page, signal),
  })
}

export function useEventDetail(memberId: number, eventId: string) {
  return useQuery({
    queryKey: eventKeys.detail(memberId, eventId),
    queryFn: ({ signal }) => fetchEventDetail(eventId, signal),
  })
}
