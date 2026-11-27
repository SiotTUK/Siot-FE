import { useTranslation } from 'react-i18next'
import type { Language } from '@/shared/api/types'
import { currentLanguage } from '@/shared/i18n'
import { ruleEntries, ruleFaqs } from './content'
import { localizeRule } from './rules'

/**
 * The language `t()` renders with, so content and labels agree.
 * `useTranslation()` re-renders the screen when the language changes.
 */
function useScreenLanguage(): Language {
  useTranslation()
  return currentLanguage()
}

/** Rules and FAQ in the screen language. */
export function useRules() {
  const language = useScreenLanguage()
  return {
    rules: ruleEntries.map((entry) => localizeRule(entry, language)),
    faqs: ruleFaqs.map((faq) => ({
      question: faq.question[language],
      answer: faq.answer[language],
      rule: faq.rule,
    })),
  }
}

export function useRule(code: string) {
  const language = useScreenLanguage()
  const entry = ruleEntries.find((item) => item.code === code)
  return entry ? localizeRule(entry, language) : undefined
}
