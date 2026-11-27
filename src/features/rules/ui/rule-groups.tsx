import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router-dom'
import { MascotTip } from '@/shared/ui/mascot-tip'
import { Muted, Section } from '@/shared/ui/page'
import { SearchField } from '@/shared/ui/search-field'
import { ruleCategories, searchRules, type Rule } from '../rules'
import { useRules } from '../use-rules'
import { RuleCard } from './rule-card'
import { RuleCategoryGrid } from './rule-category-grid'
import { RuleFaqList } from './rule-faq-list'
import styles from './rules.module.css'

/**
 * M06 생활 수칙 (Figma v2): search, 분야별 안내 tiles, FAQ TOP 5 and a 토로
 * tip. A tile opens `/rules/category/:category`; typing searches.
 */
export function RuleBrowser() {
  const { t } = useTranslation()
  const { rules, faqs } = useRules()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
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
        onChange={(event) => updateQuery(event.target.value)}
      />
      {searching ? (
        <SearchResults rules={searchRules(rules, query)} />
      ) : (
        <>
          <Section title={t('rules.byCategory')}>
            <RuleCategoryGrid />
          </Section>
          <Section title={t('rules.faqTitle')}>
            <RuleFaqList faqs={faqs} />
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
