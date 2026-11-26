import { useTranslation } from 'react-i18next'
import type { Language } from '@/shared/api/types'
import { isLanguage } from '@/shared/i18n'
import { ruleEntries, ruleFaqs } from './content'
import { localizeRule } from './rules'

/**
 * The language `t()` renders with. `currentLanguage()` reads
 * `resolvedLanguage`, which can still hold the previous language during the
 * re-render after a switch, so content and labels would disagree.
 */
function useScreenLanguage(): Language {
  const { i18n } = useTranslation()
  return isLanguage(i18n.language) ? i18n.language : 'ko'
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
