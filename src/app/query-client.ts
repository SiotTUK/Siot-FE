import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { meQueryKey } from '@/features/auth/api'
import { rotateSessionScope } from '@/features/auth/session-scope'
import { billKeys } from '@/features/bill-translation/api'
import { scheduleQueryKey } from '@/features/calendar/api'
import { checklistKeys } from '@/features/checklist/api'
import { eventKeys } from '@/features/events/api'
import { lifeChangeKeys } from '@/features/life-changes/api'
import { notificationKeys } from '@/features/notifications/api'
import { ApiError } from '../shared/api/client'

/**
 * M-10: a request rejected because the session expired logs the member out on
 * this device, so the member guard shows the login screen and comes back after.
 * (LOGIN_FAILED is also 401 but means wrong credentials, not an expired session.)
 */
function onSessionExpired(error: unknown) {
  if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
    rotateSessionScope(queryClient)
    queryClient.setQueryData(meQueryKey, null)
    queryClient.removeQueries({ queryKey: billKeys.all })
    queryClient.removeQueries({ queryKey: checklistKeys.all })
    queryClient.removeQueries({ queryKey: scheduleQueryKey })
    queryClient.removeQueries({ queryKey: eventKeys.all })
    queryClient.removeQueries({ queryKey: lifeChangeKeys.all })
    queryClient.removeQueries({ queryKey: notificationKeys.all })
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onSessionExpired }),
  mutationCache: new MutationCache({
    onError: (error, _variables, context) => {
      // Ignore session errors from work that belongs to a session that already ended.
      if (
        context &&
        typeof context === 'object' &&
        'isSessionCurrent' in context &&
        typeof context.isSessionCurrent === 'function' &&
        !context.isSessionCurrent()
      )
        return
      onSessionExpired(error)
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) && failureCount < 1,
    },
    mutations: { retry: false },
  },
})
