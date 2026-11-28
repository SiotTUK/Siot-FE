import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { MascotTip } from '@/shared/ui/mascot-tip'
import { QueryState } from '@/shared/ui/query-state'
import { Muted, Section } from '@/shared/ui/page'
import { SearchField } from '@/shared/ui/search-field'
import { ruleCategories, searchRules, type Rule } from '../rules'
import { useRuleFaqs, useRules } from '../use-rules'
import { RuleCard } from './rule-card'
import { RuleCategoryGrid } from './rule-category-grid'
import { faqTopCount, RuleFaqList } from './rule-faq-list'
import styles from './rules.module.css'

/**
 * M06 생활 수칙 (Figma v2): search, 분야별 안내 tiles, FAQ TOP 5 and a 토로
 * tip. A tile opens `/rules/category/:category`; typing searches the rules
 * from `GET /api/rules` (the API has no search parameter, #42).
 */
export function RuleBrowser() {
  const { t } = useTranslation()
  const { query: rulesQuery, rules } = useRules()
  const { query: faqQuery, faqs } = useRuleFaqs()
  const [params, setParams] = useSearchParams()
  // The input keeps its own state. Reading it back from the URL lags behind
  // (router navigation runs in a transition), and the stale value resets the
  // input mid-composition, which breaks Korean IME input (이사 -> ㅇ이잇사).
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const searching = query.trim().length > 0
  // Older links used `/rules?category=waste`; send them to the category screen.
  const oldCategory = ruleCategories.find(
    (value) => value === params.get('category'),
  )
  if (oldCategory)
    return <Navigate to={`/rules/category/${oldCategory}`} replace />

  function updateQuery(value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set('q', value)
    else next.delete('q')
    setParams(next, { replace: true, preventScrollReset: true })
  }

  return (
    <>
      <SearchField
        label={t('rules.search')}
        placeholder={t('rules.searchPlaceholder')}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          updateQuery(event.target.value)
        }}
      />
      {searching ? (
        <QueryState
          query={rulesQuery}
          keepContentOnError={Boolean(rulesQuery.data)}
        >
          <SearchResults rules={searchRules(rules, query)} />
        </QueryState>
      ) : (
        <>
          <Section title={t('rules.byCategory')}>
            <RuleCategoryGrid />
          </Section>
          <Section
            title={t('rules.faqTitle')}
            action={
              <Link
                to="/rules/faq"
                state={{ from: 'rules' }}
                className={styles.more}
              >
                {t('rules.faqAll')}
                <span aria-hidden="true"> ›</span>
              </Link>
            }
          >
            <QueryState
              query={faqQuery}
              keepContentOnError={Boolean(faqQuery.data)}
            >
              <RuleFaqList faqs={faqs.slice(0, faqTopCount)} />
            </QueryState>
          </Section>
          <MascotTip mascot="toro">{t('rules.tip')}</MascotTip>
        </>
      )}
    </>
  )
}

function SearchResults({ rules }: { rules: Rule[] }) {
  const { t } = useTranslation()
  return (
    <Section title={t('rules.results', { count: rules.length })}>
      {rules.length === 0 ? (
        <Muted>{t('rules.noResults')}</Muted>
      ) : (
        <ul className={styles.cards}>
          {rules.map((rule) => (
            <li key={rule.code}>
              <RuleCard rule={rule} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
