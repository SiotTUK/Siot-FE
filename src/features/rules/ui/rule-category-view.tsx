import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ChipGroup } from '@/shared/ui/chip-group'
import { MascotTip } from '@/shared/ui/mascot-tip'
import { Stack } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { ruleCategories, type RuleCategory } from '../rules'
import { useRules } from '../use-rules'
import { CategoryIcon } from './category-icon'
import { RuleCard } from './rule-card'
import styles from './rules.module.css'

/**
 * Figma v2 "생활 수칙 · 분야": category chips, the category card (icon, name,
 * description), "수칙 N개", rule cards and a 토로 tip.
 */
export function RuleCategoryView({ category }: { category: RuleCategory }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { query, rules: all } = useRules()
  const rules = all.filter((rule) => rule.category === category)

  return (
    <Stack gap={16}>
      <ChipGroup<RuleCategory>
        variant="pill"
        label={t('rules.byCategory')}
        value={category}
        onChange={(next) =>
          void navigate(`/rules/category/${next}`, { replace: true })
        }
        options={ruleCategories.map((value) => ({
          value,
          label: t(`rules.categories.${value}`),
        }))}
      />
      <div className={styles.categoryHead} data-category={category}>
        <span className={styles.tileIcon}>
          <CategoryIcon category={category} />
        </span>
        <span className={styles.categoryText}>
          <strong>{t(`rules.groups.${category}`)}</strong>
          <small>{t(`rules.descriptions.${category}`)}</small>
        </span>
      </div>
      <QueryState query={query}>
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
