import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { checklistKeys } from '@/features/checklist/api'
import { lifeChangeKeys } from '@/features/life-changes/api'
import { ruleKeys } from '@/features/rules/api'
import { ApiError } from '@/shared/api/client'
import type { Language } from '@/shared/api/types'
import {
  adminKeys,
  changeRole,
  fetchGuideInfo,
  fetchGuideTranslation,
  fetchReviews,
  saveGuideTranslation,
  searchMembers,
  updateGuideInfo,
  updateReview,
  type GuideInfoUpdateRequest,
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
    onSuccess: (saved) => {
      queryClient.setQueryData(adminKeys.guide(code, language), saved)
      // Saving Korean makes the BE regenerate en/zh/vi (COM-02).
      if (language === 'ko')
        return queryClient.invalidateQueries({
          queryKey: adminKeys.guideAll(code),
          predicate: ({ queryKey }) => queryKey.at(-1) !== 'ko',
        })
    },
  })
}

/** CHK-06·NTF-07 source link and contact of an item (shared by languages). */
export function useGuideInfo(code: string) {
  return useQuery({
    queryKey: adminKeys.guideInfo(code),
    queryFn: () => fetchGuideInfo(code),
    staleTime: 0,
  })
}

/**
 * Checklist, life change and rule screens show these values, so their cached
 * data is refetched after a save.
 */
export function useUpdateGuideInfo(code: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: GuideInfoUpdateRequest) => updateGuideInfo(code, body),
    onSuccess: (saved) => {
      queryClient.setQueryData(adminKeys.guideInfo(code), saved)
      return Promise.all(
        [checklistKeys.all, lifeChangeKeys.all, ruleKeys.all].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      )
    },
  })
}
