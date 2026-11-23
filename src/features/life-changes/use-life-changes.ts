import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { captureSessionScope } from '@/features/auth/session-scope'
import { checklistKeys } from '@/features/checklist/api'
import {
  deleteLifeChange,
  fetchLifeChanges,
  lifeChangeKeys,
  saveLifeChange,
  type LifeChangeResponse,
} from './api'
import type { LifeChangeCode } from './life-changes'

export function useLifeChanges(memberId: number, enabled = true) {
  return useQuery({
    queryKey: lifeChangeKeys.member(memberId),
    queryFn: ({ signal }) => fetchLifeChanges(signal),
    enabled,
  })
}

type Change = { action: 'save'; baseDate: string } | { action: 'delete' }

export function useChangeLifeChange(memberId: number, code: LifeChangeCode) {
  const queryClient = useQueryClient()
  const key = lifeChangeKeys.member(memberId)
  const checklist = { queryKey: checklistKeys.member(memberId) }

  const mutation = useMutation({
    // Keep writes to the same record ordered across editor remounts.
    scope: { id: `life-change:${memberId}:${code}` },
    onMutate: ({ isSessionCurrent }) => ({ isSessionCurrent }),
    mutationFn: async ({
      change,
      isSessionCurrent,
    }: {
      change: Change
      isSessionCurrent: () => boolean
    }) => {
      if (change.action === 'save')
        return saveLifeChange(code, change.baseDate, isSessionCurrent)
      await deleteLifeChange(code, isSessionCurrent)
      return null
    },
    onSuccess: async (saved, { isSessionCurrent }) => {
      if (!isSessionCurrent()) return
      await queryClient.cancelQueries({ queryKey: key })
      if (!isSessionCurrent()) return
      queryClient.setQueryData<LifeChangeResponse[]>(key, (current) => {
        const others = current?.filter((entry) => entry.lifeChangeCode !== code)
        if (!others) return undefined
        return saved ? [...others, saved] : others
      })
      // A previous date or deleted record must not flash on the next screen.
      await queryClient.resetQueries(checklist)
    },
  })

  return {
    ...mutation,
    apply: (change: Change, onSuccess?: () => void) => {
      const isSessionCurrent = captureSessionScope(queryClient, memberId)
      mutation.mutate(
        { change, isSessionCurrent },
        {
          onSuccess: () => {
            if (isSessionCurrent()) onSuccess?.()
          },
        },
      )
    },
  }
}
