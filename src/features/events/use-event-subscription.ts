import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { captureSessionScope } from '@/features/auth/session-scope'
import {
  eventKeys,
  fetchEventSubscription,
  saveEventSubscription,
  type EventDetail,
  type EventLeadDays,
} from './api'

export function useEventSubscription(memberId: number, eventId: string) {
  const client = useQueryClient()
  const queryKey = eventKeys.subscription(memberId, eventId)
  const detailKey = eventKeys.detail(memberId, eventId)
  const pending = useIsMutating({ mutationKey: queryKey, exact: true }) > 0
  const status = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchEventSubscription(eventId, signal),
  })
  const mutation = useMutation({
    mutationKey: queryKey,
    onMutate: ({ isSessionCurrent }) => ({ isSessionCurrent }),
    mutationFn: ({
      leadDays,
      isSessionCurrent,
    }: {
      leadDays: EventLeadDays | null
      isSessionCurrent: () => boolean
    }) => saveEventSubscription(eventId, leadDays, isSessionCurrent),
    onSuccess: async (saved, { isSessionCurrent }) => {
      if (!isSessionCurrent()) return
      await Promise.all([
        client.cancelQueries({ queryKey, exact: true }),
        client.cancelQueries({ queryKey: detailKey, exact: true }),
      ])
      if (!isSessionCurrent()) return
      client.setQueryData(queryKey, saved)
      client.setQueryData<EventDetail>(
        detailKey,
        (detail) => detail && { ...detail, subscribed: saved.subscribed },
      )
      void client.invalidateQueries({ queryKey: eventKeys.lists(memberId) })
      void client.invalidateQueries({
        queryKey: eventKeys.recommendations(memberId),
      })
    },
  })

  return {
    status,
    pending,
    error: mutation.error,
    save: (leadDays: EventLeadDays | null, onSaved: () => void) => {
      if (client.isMutating({ mutationKey: queryKey, exact: true })) return
      const isSessionCurrent = captureSessionScope(client, memberId)
      mutation.mutate(
        { leadDays, isSessionCurrent },
        {
          onSuccess: () => {
            if (isSessionCurrent()) onSaved()
          },
        },
      )
    },
  }
}
