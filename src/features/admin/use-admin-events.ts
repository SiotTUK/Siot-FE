import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { eventKeys, fetchEventCollectionStatus } from '@/features/events/api'
import {
  adminEventKeys,
  collectEvents,
  createAdminEvent,
  deleteAdminEvent,
  fetchAdminEvent,
  fetchAdminEvents,
  updateAdminEvent,
  type AdminEventCreateRequest,
  type AdminEventFilters,
  type AdminEventUpdateRequest,
} from './event-api'

/** After any change: admin event data and every member event screen. */
function useRefreshEvents() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [adminEventKeys.all, eventKeys.all].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
}

export function useAdminEvents(filters: AdminEventFilters) {
  return useInfiniteQuery({
    queryKey: adminEventKeys.list(filters),
    queryFn: ({ pageParam }) => fetchAdminEvents(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
}

export function useAdminEvent(eventId: number) {
  return useQuery({
    queryKey: adminEventKeys.detail(eventId),
    queryFn: () => fetchAdminEvent(eventId),
    enabled: Number.isInteger(eventId) && eventId > 0,
    staleTime: 0,
  })
}

export function useCreateAdminEvent() {
  const refresh = useRefreshEvents()
  return useMutation({
    mutationFn: ({
      body,
      force,
    }: {
      body: AdminEventCreateRequest
      force: boolean
    }) => createAdminEvent(body, force),
    onSuccess: refresh,
  })
}

export function useUpdateAdminEvent(eventId: number) {
  const refresh = useRefreshEvents()
  return useMutation({
    mutationFn: (body: AdminEventUpdateRequest) =>
      updateAdminEvent(eventId, body),
    onSuccess: refresh,
  })
}

export function useDeleteAdminEvent(eventId: number) {
  const refresh = useRefreshEvents()
  return useMutation({
    mutationFn: () => deleteAdminEvent(eventId),
    onSuccess: refresh,
  })
}

/** EVE-10 last successful collection (`GET /api/events/collection-status`). */
export function useEventCollectionStatus() {
  return useQuery({
    queryKey: eventKeys.collectionStatus(),
    queryFn: ({ signal }) => fetchEventCollectionStatus(signal),
  })
}

export function useCollectEvents() {
  const refresh = useRefreshEvents()
  return useMutation({ mutationFn: collectEvents, onSuccess: refresh })
}
