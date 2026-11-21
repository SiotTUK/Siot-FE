import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { meQueryKey } from '@/features/auth/api'
import { ApiError } from '../shared/api/client'

/**
 * M-10: a request rejected because the session expired logs the member out on
 * this device, so the member guard shows the login screen and comes back after.
 * (LOGIN_FAILED is also 401 but means wrong credentials, not an expired session.)
 */
function onSessionExpired(error: unknown) {
  if (error instanceof ApiError && error.code === 'UNAUTHORIZED')
    queryClient.setQueryData(meQueryKey, null)
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onSessionExpired }),
  mutationCache: new MutationCache({ onError: onSessionExpired }),
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
