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

/** Turns one settings group on or off (one PUT per BE kind). */
export function useUpdatePreferenceGroup(memberId: number) {
  const queryClient = useQueryClient()
  const key = notificationKeys.preferences(memberId)
  return useMutation({
    mutationFn: ({
      group,
      enabled,
    }: {
      group: PreferenceGroup
      enabled: boolean
    }) => {
      const current =
        queryClient.getQueryData<NotificationPreference[]>(key) ?? []
      return Promise.all(
        groupUpdates(current, group, enabled).map(updatePreference),
      )
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<NotificationPreference[]>(key, (prefs) =>
        prefs?.map(
          (pref) => saved.find((item) => item.kind === pref.kind) ?? pref,
        ),
      )
    },
    // Some kinds may have saved before a failure; read the server again.
    onError: () => void queryClient.invalidateQueries({ queryKey: key }),
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
