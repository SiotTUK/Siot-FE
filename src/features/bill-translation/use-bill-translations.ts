import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { captureSessionScope } from '@/features/auth/session-scope'
import {
  billKeys,
  changeBillReminder,
  deleteBillTranslation,
  getBillTranslation,
  listBillTranslations,
  translateBill,
  type RecentBillTranslation,
} from './api'

type Write<T> = T & { isSessionCurrent: () => boolean }

export function useRecentBills(memberId: number) {
  return useQuery({
    queryKey: billKeys.list(memberId),
    queryFn: ({ signal }) => listBillTranslations(signal),
  })
}

export function useBill(memberId: number, id: number) {
  return useQuery({
    queryKey: billKeys.detail(memberId, id),
    queryFn: ({ signal }) => getBillTranslation(id, signal),
  })
}

export function useTranslateBill(memberId: number) {
  const client = useQueryClient()
  const mutation = useMutation({
    gcTime: 0,
    onMutate: ({ isSessionCurrent }) => ({ isSessionCurrent }),
    mutationFn: ({
      input,
      signal,
      isSessionCurrent,
    }: Write<{
      input: Parameters<typeof translateBill>[0]
      signal: AbortSignal
    }>) => translateBill(input, signal, isSessionCurrent),
    onSuccess: (result, { isSessionCurrent }) => {
      if (result.id === null || !isSessionCurrent()) return
      client.setQueryData(billKeys.detail(memberId, result.id), result)
      void client.invalidateQueries({ queryKey: billKeys.list(memberId) })
    },
  })
  return {
    ...mutation,
    start: (input: Parameters<typeof translateBill>[0], signal: AbortSignal) =>
      mutation.mutateAsync({
        input,
        signal,
        isSessionCurrent: captureSessionScope(client, memberId),
      }),
  }
}

export function useBillReminder(memberId: number, id: number) {
  const client = useQueryClient()
  const mutation = useMutation({
    onMutate: ({ isSessionCurrent }) => ({ isSessionCurrent }),
    mutationFn: ({ enabled, isSessionCurrent }: Write<{ enabled: boolean }>) =>
      changeBillReminder(id, enabled, isSessionCurrent),
    onSuccess: (result, { isSessionCurrent }) => {
      if (!isSessionCurrent()) return
      client.setQueryData(billKeys.detail(memberId, id), result)
      void client.invalidateQueries({ queryKey: billKeys.list(memberId) })
    },
  })
  return {
    ...mutation,
    change: (enabled: boolean) =>
      mutation.mutate({
        enabled,
        isSessionCurrent: captureSessionScope(client, memberId),
      }),
  }
}

export function useDeleteBill(memberId: number) {
  const client = useQueryClient()
  const mutation = useMutation({
    onMutate: ({ isSessionCurrent }) => ({ isSessionCurrent }),
    mutationFn: ({ id, isSessionCurrent }: Write<{ id: number }>) =>
      deleteBillTranslation(id, isSessionCurrent),
    onSuccess: (_, { id, isSessionCurrent }) => {
      if (!isSessionCurrent()) return
      client.removeQueries({ queryKey: billKeys.detail(memberId, id) })
      const key = billKeys.list(memberId)
      client.setQueryData<RecentBillTranslation[]>(key, (items) =>
        items?.filter((item) => item.id !== id),
      )
      void client.invalidateQueries({ queryKey: key })
    },
  })
  return {
    ...mutation,
    remove: (id: number, onSuccess: () => void) => {
      const isSessionCurrent = captureSessionScope(client, memberId)
      mutation.mutate(
        { id, isSessionCurrent },
        {
          onSuccess: () => {
            if (isSessionCurrent()) onSuccess()
          },
        },
      )
    },
  }
}
