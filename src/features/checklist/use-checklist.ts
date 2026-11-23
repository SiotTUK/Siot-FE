import {
  CancelledError,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { meQueryKey } from '@/features/auth/api'
import type { Language, MemberResponse } from '@/shared/api/types'
import {
  checklistKeys,
  fetchChecklist,
  updateChecklistItem,
  type ChecklistItemResponse,
  type ChecklistMark,
  type ChecklistSummaryResponse,
} from './api'
import { checklistItemKey, optimisticStatus } from './checklist'

/** Text comes in the screen language, so the language is part of the key. */
export function useChecklist(memberId: number, language: Language) {
  return useQuery({
    queryKey: checklistKeys.summary(memberId, language),
    queryFn: ({ signal }) => fetchChecklist(language, signal),
  })
}

/** Update the card optimistically, then refresh the member's active checklist. */
export function useMarkChecklistItem(memberId: number, language: Language) {
  const queryClient = useQueryClient()
  const key = checklistKeys.summary(memberId, language)
  return useMutation({
    mutationFn: ({
      item,
      mark,
    }: {
      item: ChecklistItemResponse
      mark: ChecklistMark
    }) =>
      updateChecklistItem(item.code, {
        periodKey: item.periodKey,
        status: mark,
      }),
    onMutate: async ({ item, mark }) => {
      const cache = queryClient.getQueryCache()
      const filter = { queryKey: key, exact: true }
      const query = cache.find(filter)
      // Logout removes this query. A later login can create a new one with the same key.
      const isSessionCurrent = () =>
        !!query &&
        cache.find(filter) === query &&
        queryClient.getQueryData<MemberResponse | null>(meQueryKey)?.id ===
          memberId

      await queryClient.cancelQueries({ queryKey: key })
      if (!isSessionCurrent()) throw new CancelledError()
      const itemKey = checklistItemKey(item)
      const previous = queryClient
        .getQueryData<ChecklistSummaryResponse>(key)
        ?.items.find((entry) => checklistItemKey(entry) === itemKey)
      queryClient.setQueryData<ChecklistSummaryResponse>(
        key,
        (current) =>
          current && {
            ...current,
            items: current.items.map((entry) =>
              checklistItemKey(entry) === itemKey
                ? {
                    ...entry,
                    status: optimisticStatus(entry, mark),
                    completed: mark === 'DONE',
                  }
                : entry,
            ),
          },
      )
      return { key, memberId, isSessionCurrent, previous }
    },
    onError: (_error, { item }, context) => {
      const previous = context?.previous
      if (!previous || !context.isSessionCurrent()) return
      const itemKey = checklistItemKey(item)
      queryClient.setQueryData<ChecklistSummaryResponse>(
        context.key,
        (current) =>
          current && {
            ...current,
            items: current.items.map((entry) =>
              checklistItemKey(entry) === itemKey
                ? {
                    ...entry,
                    status: previous.status,
                    completed: previous.completed,
                  }
                : entry,
            ),
          },
      )
    },
    onSettled: (_data, _error, _input, context) => {
      if (context?.isSessionCurrent())
        return queryClient.invalidateQueries({
          queryKey: checklistKeys.member(context.memberId),
        })
    },
  })
}
