import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { PageResponse } from '@/shared/api/types'
import {
  fetchNotifications,
  fetchPreferences,
  fetchUnreadCount,
  markNotificationRead,
  notificationKeys,
  updatePreference,
  type NotificationItem,
  type NotificationPreference,
} from './api'
import { groupUpdates, type PreferenceGroup } from './notifications'

export function usePreferences(memberId: number) {
  return useQuery({
    queryKey: notificationKeys.preferences(memberId),
    queryFn: ({ signal }) => fetchPreferences(signal),
  })
}

/**
 * Turns one settings group on or off (one PUT per BE kind). It waits for
 * every PUT, even after one fails, so the re-read below sees the final state.
 */
export function useUpdatePreferenceGroup(memberId: number) {
  const queryClient = useQueryClient()
  const key = notificationKeys.preferences(memberId)
  return useMutation({
    mutationFn: async ({
      group,
      enabled,
    }: {
      group: PreferenceGroup
      enabled: boolean
    }) => {
      const current =
        queryClient.getQueryData<NotificationPreference[]>(key) ?? []
      const results = await Promise.allSettled(
        groupUpdates(current, group, enabled).map(updatePreference),
      )
      const saved: NotificationPreference[] = []
      for (const result of results) {
        if (result.status === 'rejected') throw result.reason
        saved.push(result.value)
      }
      return saved
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<NotificationPreference[]>(key, (prefs) =>
        prefs?.map(
          (pref) => saved.find((item) => item.kind === pref.kind) ?? pref,
        ),
      )
    },
    // Some kinds may have saved; read the server again. Returning the promise
    // keeps the mutation pending (switches locked) until the re-read is done.
    onError: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

export function useUnreadCount(memberId: number) {
  return useQuery({
    queryKey: notificationKeys.unread(memberId),
    queryFn: ({ signal }) => fetchUnreadCount(signal),
    select: (data) => data.unreadCount,
  })
}

export function useNotifications(memberId: number) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(memberId),
    queryFn: ({ pageParam, signal }) => fetchNotifications(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
}

/** Marks one notification read, updates it in the list and refreshes the badge. */
export function useMarkNotificationRead(memberId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (updated) => {
      queryClient.setQueryData<InfiniteData<PageResponse<NotificationItem>>>(
        notificationKeys.list(memberId),
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              content: page.content.map((item) =>
                item.notificationId === updated.notificationId ? updated : item,
              ),
            })),
          },
      )
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.unread(memberId),
      })
    },
  })
}
