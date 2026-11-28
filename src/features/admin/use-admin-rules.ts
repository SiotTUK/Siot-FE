import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ruleKeys } from '@/features/rules/api'
import type { Language } from '@/shared/api/types'
import { adminKeys } from './api'
import {
  adminRuleKeys,
  createRule,
  createRuleFaq,
  deleteRule,
  deleteRuleFaq,
  fetchAdminRule,
  fetchAdminRules,
  fetchRuleCategories,
  fetchRuleFaqs,
  renameRuleCategory,
  saveRuleCategoryTranslation,
  updateRule,
  updateRuleFaq,
  type AdminRuleFilters,
  type RuleCreateRequest,
  type RuleFaqRequest,
  type RuleUpdateRequest,
} from './rule-api'

/**
 * After any change: the admin rule data, the members' rule screens (list,
 * detail, FAQ, categories) and the admin text editor (the BE regenerates
 * en/zh/vi when the Korean text changes).
 */
function useRefreshRules() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [adminRuleKeys.all, ruleKeys.all, [...adminKeys.all, 'guide']].map(
        (queryKey) => queryClient.invalidateQueries({ queryKey }),
      ),
    )
}

export function useAdminRules(filters: AdminRuleFilters) {
  return useQuery({
    queryKey: adminRuleKeys.list(filters),
    queryFn: () => fetchAdminRules(filters),
    placeholderData: keepPreviousData,
  })
}

export function useAdminRule(code: string | undefined) {
  return useQuery({
    queryKey: adminRuleKeys.detail(code ?? ''),
    queryFn: () => fetchAdminRule(code ?? ''),
    enabled: Boolean(code),
    staleTime: 0,
  })
}

export function useCreateRule() {
  const refresh = useRefreshRules()
  return useMutation({
    mutationFn: (body: RuleCreateRequest) => createRule(body),
    onSuccess: refresh,
  })
}

export function useUpdateRule(code: string) {
  const refresh = useRefreshRules()
  return useMutation({
    mutationFn: (body: RuleUpdateRequest) => updateRule(code, body),
    onSuccess: refresh,
  })
}

export function useDeleteRule(code: string) {
  const refresh = useRefreshRules()
  return useMutation({
    mutationFn: () => deleteRule(code),
    onSuccess: refresh,
  })
}

export function useRuleCategories() {
  return useQuery({
    queryKey: adminRuleKeys.categories(),
    queryFn: fetchRuleCategories,
  })
}

export function useRenameRuleCategory(category: string) {
  const refresh = useRefreshRules()
  return useMutation({
    mutationFn: (name: string) => renameRuleCategory(category, name),
    onSuccess: refresh,
  })
}

export function useSaveRuleCategoryTranslation(category: string) {
  const refresh = useRefreshRules()
  return useMutation({
    mutationFn: (input: { language: Exclude<Language, 'ko'>; name: string }) =>
      saveRuleCategoryTranslation(category, input.language, input.name),
    onSuccess: refresh,
  })
}

export function useRuleFaqs() {
  return useQuery({ queryKey: adminRuleKeys.faqs(), queryFn: fetchRuleFaqs })
}

/** Creates when `faqId` is undefined, otherwise replaces that FAQ. */
export function useSaveRuleFaq(faqId: number | undefined) {
  const refresh = useRefreshRules()
  return useMutation({
    mutationFn: (body: RuleFaqRequest) =>
      faqId === undefined ? createRuleFaq(body) : updateRuleFaq(faqId, body),
    onSuccess: refresh,
  })
}

export function useDeleteRuleFaq(faqId: number) {
  const refresh = useRefreshRules()
  return useMutation({
    mutationFn: () => deleteRuleFaq(faqId),
    onSuccess: refresh,
  })
}
