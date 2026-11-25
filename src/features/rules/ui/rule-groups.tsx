import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChipGroup } from '@/shared/ui/chip-group'
import { TextField } from '@/shared/ui/field'
import { SearchIcon } from '@/shared/ui/icons'
import { Muted, Section, Stack } from '@/shared/ui/page'
import {
  groupByCategory,
  ruleCategories,
  searchRules,
  type Rule,
  type RuleCategory,
} from '../rules'
import { useRules } from '../use-rules'
import { RuleCategoryCard } from './rule-category-card'
import { RuleFaqList } from './rule-faq-list'
import styles from './rules.module.css'

type Filter = 'all' | RuleCategory

/** M06 생활 수칙: search, category chips, FAQ TOP 5 and "분야별 안내". */
export function RuleBrowser() {
  const { t } = useTranslation()
  const { rules, faqs } = useRules()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const searching = query.trim().length > 0
  const groups = groupByCategory(
    filter === 'all' ? rules : rules.filter((rule) => rule.category === filter),
  )

  return (
    <>
      <div className={styles.search}>
        <SearchIcon className={styles.searchIcon} />
        <TextField
          label={t('rules.search')}
          hideLabel
          type="search"
          placeholder={t('rules.searchPlaceholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {!searching && (
        <ChipGroup<Filter>
          label={t('rules.categoriesLabel')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('rules.all') },
            ...ruleCategories.map((category) => ({
              value: category,
              label: t(`rules.categories.${category}`),
            })),
          ]}
        />
      )}

      {searching ? (
        <SearchResults rules={searchRules(rules, query)} />
      ) : (
        <>
          {filter === 'all' && (
            <Section title={t('rules.faqTitle')}>
              <RuleFaqList faqs={faqs} />
            </Section>
          )}
          <Section title={t('rules.byCategory')}>
            <Stack gap={12}>
              {groups.map((group) => (
                <RuleCategoryCard
                  // Remount on filter change so the open state resets.
                  key={`${filter}:${group.category}`}
                  group={group}
                  defaultOpen={filter !== 'all'}
                  onViewAll={
                    filter === 'all'
                      ? () => setFilter(group.category)
                      : undefined
                  }
                />
              ))}
            </Stack>
          </Section>
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
        <ul className={`${styles.rows} ${styles.resultList}`}>
          {rules.map((rule) => (
            <li key={rule.code}>
              <Link to={`/rules/${rule.code}`}>
                <span>
                  {rule.title}
                  <small>{rule.summary}</small>
                </span>
                <span aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
