import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '@/shared/lib/document-title'
import { ChipGroup } from '@/shared/ui/chip-group'
import { MascotTip } from '@/shared/ui/mascot-tip'
import { Stack, Tag } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { RuleCategoryResponse } from '../api'
import {
  categoryPath,
  categorySlug,
  isRuleCategory,
  ruleBelongsToCategory,
} from '../rules'
import { useRules } from '../use-rules'
import { CategoryIcon } from './category-icon'
import { RuleCard } from './rule-card'
import styles from './rules.module.css'

/**
 * Figma v2 "생활 수칙 · 분야": category chips (including admin-added
 * categories), the category card, "수칙 N개", rule cards and a 토로 tip.
 */
export function RuleCategoryView({
  category,
  categories,
}: {
  category: RuleCategoryResponse
  categories: readonly RuleCategoryResponse[]
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { query, rules: all } = useRules()
  const builtIn = isRuleCategory(category.key) ? category.key : null
  const activeSlug = categorySlug(category)
  useDocumentTitle(category.name, t('nav.rules'))
  const rules = all.filter((rule) => ruleBelongsToCategory(rule, category))

  return (
    <Stack gap={16}>
      <ChipGroup<string>
        variant="pill"
        label={t('rules.byCategory')}
        value={activeSlug}
        onChange={(nextSlug) => {
          const target = categories.find(
            (item) => categorySlug(item) === nextSlug,
          )
          if (target) void navigate(categoryPath(target), { replace: true })
        }}
        options={categories.map((item) => ({
          value: categorySlug(item),
          label: item.name,
        }))}
      />
      <div className={styles.categoryHead} data-category={builtIn ?? undefined}>
        <span className={styles.tileIcon}>
          <CategoryIcon category={builtIn} />
        </span>
        <span className={styles.categoryText}>
          <strong>{category.name}</strong>
          {builtIn && <small>{t(`rules.descriptions.${builtIn}`)}</small>}
          {!category.translated && (
            <Tag tone="warning">{t('rules.translationPending')}</Tag>
          )}
        </span>
      </div>
      <QueryState query={query} keepContentOnError={Boolean(query.data)}>
        <h2 className={styles.count}>
          {t('rules.ruleCount', { count: rules.length })}
        </h2>
        <ul className={styles.cards}>
          {rules.map((rule) => (
            <li key={rule.code}>
              <RuleCard rule={rule} />
            </li>
          ))}
        </ul>
      </QueryState>
      <MascotTip mascot="toro">{t('rules.categoryTip')}</MascotTip>
    </Stack>
  )
}
