import { useTranslation } from 'react-i18next'
import type { Language } from '@/shared/api/types'
import { currentLanguage } from '@/shared/i18n'
import { useRuleFaqQuery, useRuleListQuery, useRuleQuery } from './api'
import { toFaqItems, toRule } from './rules'

/**
 * The language `t()` renders with, so content and labels agree.
 * `useTranslation()` re-renders the screen when the language changes, and
 * the new language is a new query key, so the rules are fetched again.
 */
export function useScreenLanguage(): Language {
  useTranslation()
  return currentLanguage()
}

/** Every rule in the screen language (`GET /api/rules`). */
export function useRules() {
  const language = useScreenLanguage()
  const query = useRuleListQuery(language)
  return {
    query,
    rules: query.data?.map((rule) => toRule(rule, language)) ?? [],
  }
}

/** 자주 묻는 질문 in the screen language (`GET /api/rules/faq`). */
export function useRuleFaqs() {
  const query = useRuleFaqQuery(useScreenLanguage())
  return { query, faqs: query.data ? toFaqItems(query.data) : [] }
}

/** One rule (`GET /api/rules/{code}`); `rule` is undefined while loading or on error. */
export function useRule(code: string) {
  const language = useScreenLanguage()
  const query = useRuleQuery(code, language)
  return { query, rule: query.data ? toRule(query.data, language) : undefined }
}
