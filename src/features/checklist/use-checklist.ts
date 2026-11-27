import {
  CancelledError,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { captureSessionScope } from '@/features/auth/session-scope'
import type { Language } from '@/shared/api/types'
import {
  checklistKeys,
  fetchChecklist,
  updateChecklistItem,
  type ChecklistItemResponse,
  type ChecklistMark,
  type ChecklistSummaryResponse,
} from './api'
import { checklistItemKey, optimisticStatus } from './checklist'

type MarkInput = { item: ChecklistItemResponse; mark: ChecklistMark }

/** Text comes in the screen language, so the language is part of the key. */
export function useChecklist(memberId: number, language: Language) {
  return useQuery({
    queryKey: checklistKeys.summary(memberId, language),
    queryFn: ({ signal }) => fetchChecklist(language, signal),
  })
}

/** Look up a single checklist item by its code from the member's checklist. */
export function useChecklistItem(
  memberId: number,
  language: Language,
  code: string | undefined,
) {
  const query = useChecklist(memberId, language)
  const item = code
    ? query.data?.items.find((entry) => entry.code === code)
    : undefined
  return {
    ...query,
    item,
    notFound: query.isSuccess && !query.isFetching && item === undefined,
  }
}

/**
 * Update the card optimistically, then refresh the member's active checklist.
 * Only the items being saved are locked (`isSaving`), so the other
 * checkboxes don't flash grey on every tap.
 */
export function useMarkChecklistItem(memberId: number, language: Language) {
  const queryClient = useQueryClient()
  const key = checklistKeys.summary(memberId, language)
  const mutationKey = ['checklist-mark', memberId]
  const saving = new Set(
    useMutationState({
      filters: { mutationKey, status: 'pending' },
      select: (mutation) =>
        checklistItemKey((mutation.state.variables as MarkInput).item),
    }),
  )
  const { mutate, isPending, isError, error } = useMutation({
    mutationKey,
    mutationFn: ({
      item,
      mark,
      isSessionCurrent,
    }: MarkInput & { isSessionCurrent: () => boolean }) =>
      updateChecklistItem(
        item.code,
        { periodKey: item.periodKey, status: mark },
        isSessionCurrent,
      ),
    onMutate: async ({ item, mark, isSessionCurrent }) => {
      const cache = queryClient.getQueryCache()
      const filter = { queryKey: key, exact: true }

      await queryClient.cancelQueries(filter)
      if (!isSessionCurrent()) throw new CancelledError()
      const query = cache.find(filter)
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
      return {
        key,
        memberId,
        isSessionCurrent,
        isQueryCurrent: () => cache.find(filter) === query,
        previous,
      }
    },
    onError: (_error, { item }, context) => {
      const previous = context?.previous
      if (!previous || !context.isSessionCurrent() || !context.isQueryCurrent())
        return
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
      // Refetch after the last save only, so an early response can't undo
      // another item's optimistic check for a moment.
      if (
        context?.isSessionCurrent() &&
        queryClient.isMutating({ mutationKey }) === 1
      )
        return queryClient.invalidateQueries({
          queryKey: checklistKeys.member(context.memberId),
        })
    },
  })

  return {
    isPending,
    isSaving: (item: ChecklistItemResponse) =>
      saving.has(checklistItemKey(item)),
    isError,
    error,
    mutate: (input: MarkInput) =>
      mutate({
        ...input,
        isSessionCurrent: captureSessionScope(queryClient, memberId),
      }),
  }
}
