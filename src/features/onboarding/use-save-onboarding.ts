import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQueryKey } from '@/features/auth/api'
import { memberScheduleQueryKey } from '@/features/calendar/api'
import { checklistKeys } from '@/features/checklist/api'
import { ApiError } from '@/shared/api/client'
import { saveOnboarding } from './api'

/** PUT all five answers; the saved member replaces the `me` cache. */
export function useSaveOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveOnboarding,
    onSuccess: (member) => {
      queryClient.setQueryData(meQueryKey, member)
      const affectedKeys = [
        checklistKeys.member(member.id),
        memberScheduleQueryKey(member.id),
      ]
      return Promise.all(
        affectedKeys.map((queryKey) => {
          // Returning to either tab should load the saved answers without flashing old data.
          queryClient.removeQueries({ queryKey, type: 'inactive' })
          return queryClient.invalidateQueries({ queryKey })
        }),
      )
    },
    onError: (error) => {
      // Session expired: the route guard sends the member to login.
      if (error instanceof ApiError && error.status === 401)
        queryClient.setQueryData(meQueryKey, null)
    },
  })
}
