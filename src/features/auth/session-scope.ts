import type { QueryClient } from '@tanstack/react-query'
import type { MemberResponse } from '@/shared/api/types'
import { meQueryKey } from './api'

const sessionVersions = new WeakMap<QueryClient, symbol>()

export function rotateSessionScope(queryClient: QueryClient) {
  sessionVersions.set(queryClient, Symbol())
}

/** Profile writes replace cached member data without changing the session. */
export function captureSessionScope(
  queryClient: QueryClient,
  memberId: number,
) {
  const version = sessionVersions.get(queryClient)
  return () =>
    sessionVersions.get(queryClient) === version &&
    queryClient.getQueryData<MemberResponse | null>(meQueryKey)?.id === memberId
}
