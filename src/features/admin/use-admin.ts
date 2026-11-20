import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ApiError } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'
import {
  adminKeys,
  changeRole,
  fetchGuideTranslation,
  fetchReviews,
  saveGuideTranslation,
  searchMembers,
  updateReview,
  type GuideTranslationUpdateRequest,
  type ReviewType,
  type Role,
} from './api'

const nextPage = (last: { hasNext: boolean; page: number }) =>
  last.hasNext ? last.page + 1 : undefined

export function useMembers(email: string, role: Role | '') {
  return useInfiniteQuery({
    queryKey: adminKeys.members(email, role),
    queryFn: ({ pageParam }) => searchMembers(email, role, pageParam),
    initialPageParam: 0,
    getNextPageParam: nextPage,
  })
}

export function useChangeRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { memberId: number; role: Role }) =>
      changeRole(input.memberId, input.role),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, 'members'],
      }),
  })
}

export function useReviews(type: ReviewType, reviewed: boolean | undefined) {
  return useInfiniteQuery({
    queryKey: adminKeys.reviews(type, reviewed),
    queryFn: ({ pageParam }) => fetchReviews(type, reviewed, pageParam),
    initialPageParam: 0,
    getNextPageParam: nextPage,
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      messageId: number
      reviewed: boolean
      adminMemo: string | null
    }) =>
      updateReview(input.messageId, {
        reviewed: input.reviewed,
        adminMemo: input.adminMemo,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, 'reviews'],
      }),
  })
}

/**
 * One language of an item. A language without text yet (404
 * GUIDE_TRANSLATION_NOT_FOUND) resolves to null: saving creates it.
 */
export function useGuideTranslation(
  code: string | undefined,
  language: Language,
) {
  return useQuery({
    queryKey: adminKeys.guide(code ?? '', language),
    queryFn: async () => {
      try {
        return await fetchGuideTranslation(code ?? '', language)
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.code === 'GUIDE_TRANSLATION_NOT_FOUND'
        )
          return null
        throw error
      }
    },
    enabled: Boolean(code),
    staleTime: 0,
  })
}

export function useSaveGuideTranslation(code: string, language: Language) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: GuideTranslationUpdateRequest) =>
      saveGuideTranslation(code, language, body),
    onSuccess: (saved) =>
      queryClient.setQueryData(adminKeys.guide(code, language), saved),
  })
}
