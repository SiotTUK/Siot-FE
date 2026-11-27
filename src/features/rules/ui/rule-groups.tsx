import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
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
  const [params, setParams] = useSearchParams()
  const categoryChips = useRef<HTMLDivElement>(null)
  // The input keeps its own state. Reading it back from the URL lags behind
  // (router navigation runs in a transition), and the stale value resets the
  // input mid-composition, which breaks Korean IME input (이사 -> ㅇ이잇사).
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const filter =
    ruleCategories.find((category) => category === params.get('category')) ??
    'all'
  const searching = query.trim().length > 0
  const groups = groupByCategory(
    filter === 'all' ? rules : rules.filter((rule) => rule.category === filter),
  )

  function updateParam(name: 'q' | 'category', value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next, { replace: true, preventScrollReset: true })
  }

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
          onChange={(event) => {
            setQuery(event.target.value)
            updateParam('q', event.target.value)
          }}
        />
      </div>
      {!searching && (
        <ChipGroup<Filter>
          ref={categoryChips}
          label={t('rules.categoriesLabel')}
          value={filter}
          onChange={(category) =>
            updateParam('category', category === 'all' ? '' : category)
          }
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
                      ? () => {
                          categoryChips.current
                            ?.querySelector<HTMLButtonElement>(
                              `button[value="${group.category}"]`,
                            )
                            ?.focus()
                          updateParam('category', group.category)
                        }
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
              <Link to={`/rules/${rule.code}`} state={{ from: 'rules' }}>
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
