import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { captureSessionScope } from '@/features/auth/session-scope'
import {
  eventKeys,
  saveEventSubscription,
  type EventDetail,
  type EventSubscriptionStatus,
} from './api'

/**
 * ♥ 찜 (Figma v2): saving an event is the existing event subscription. A new
 * save asks for the 1-day reminder; the detail screen can change it. Shares
 * the mutation key with `useEventSubscription`, so the two never race.
 */
export function useEventHeart(
  memberId: number,
  eventId: number,
  saved: boolean,
) {
  const client = useQueryClient()
  const id = String(eventId)
  const queryKey = eventKeys.subscription(memberId, id)
  // Shown state while saving; falls back to the server value afterwards.
  const [optimistic, setOptimistic] = useState<boolean>()
  const mutation = useMutation({
    mutationKey: queryKey,
    mutationFn: ({
      next,
      isSessionCurrent,
    }: {
      next: boolean
      isSessionCurrent: () => boolean
    }) => saveEventSubscription(id, next ? 1 : null, isSessionCurrent),
    onSuccess: (result: EventSubscriptionStatus, { isSessionCurrent }) => {
      if (!isSessionCurrent()) return
      client.setQueryData(queryKey, result)
      client.setQueryData<EventDetail>(
        eventKeys.detail(memberId, id),
        (detail) => detail && { ...detail, subscribed: result.subscribed },
      )
      void client.invalidateQueries({ queryKey: eventKeys.lists(memberId) })
      void client.invalidateQueries({ queryKey: eventKeys.saved(memberId) })
      void client.invalidateQueries({
        queryKey: eventKeys.recommendations(memberId),
      })
    },
    onSettled: () => setOptimistic(undefined),
  })

  const liked = optimistic ?? saved
  return {
    liked,
    pending: mutation.isPending,
    error: mutation.error,
    toggle: () => {
      if (client.isMutating({ mutationKey: queryKey, exact: true })) return
      setOptimistic(!liked)
      mutation.mutate({
        next: !liked,
        isSessionCurrent: captureSessionScope(client, memberId),
      })
    },
  }
}
