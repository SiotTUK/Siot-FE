import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Language } from '@/shared/api/types'
import {
  checklistKeys,
  fetchChecklist,
  updateChecklistItem,
  type ChecklistItemResponse,
  type ChecklistMark,
  type ChecklistSummaryResponse,
} from './api'
import { keepOrder, optimisticStatus } from './checklist'

/** Text comes in the screen language, so the language is part of the key. */
export function useChecklist(language: Language) {
  return useQuery({
    queryKey: checklistKeys.summary(language),
    queryFn: () => fetchChecklist(language),
  })
}

/**
 * Marks an item done / not applicable / back to TODO. The card changes right
 * away; afterwards status and progress come from the server again, but in the
 * order already on screen so cards do not jump (see keepOrder).
 */
export function useMarkChecklistItem(language: Language) {
  const queryClient = useQueryClient()
  const key = checklistKeys.summary(language)
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
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ChecklistSummaryResponse>(key)
      queryClient.setQueryData<ChecklistSummaryResponse>(
        key,
        (current) =>
          current && {
            ...current,
            items: current.items.map((entry) =>
              entry.code === item.code && entry.periodKey === item.periodKey
                ? {
                    ...entry,
                    status: optimisticStatus(entry, mark),
                    completed: mark === 'DONE',
                  }
                : entry,
            ),
          },
      )
      return { previous }
    },
    onError: (_error, _input, context) =>
      queryClient.setQueryData(key, context?.previous),
    onSettled: async () => {
      // Other languages are stale too; they refetch when shown.
      void queryClient.invalidateQueries({
        queryKey: checklistKeys.all,
        refetchType: 'none',
      })
      try {
        const fresh = await fetchChecklist(language)
        queryClient.setQueryData<ChecklistSummaryResponse>(key, (shown) => ({
          ...fresh,
          items: keepOrder(fresh.items, shown?.items ?? []),
        }))
      } catch {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}
