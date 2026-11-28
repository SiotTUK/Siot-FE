import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Tag } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import { categoryPath, categorySlug, isRuleCategory } from '../rules'
import { useRuleCategories } from '../use-rules'
import { CategoryIcon } from './category-icon'
import styles from './rules.module.css'

/**
 * Figma v2 M06 "분야별 안내": tiles in server `sortOrder` from
 * `GET /api/rules/categories`, including admin-added categories (`key: null`).
 */
export function RuleCategoryGrid() {
  const { t } = useTranslation()
  const { query, categories } = useRuleCategories()

  return (
    <QueryState query={query} keepContentOnError={categories.length > 0}>
      <ul className={styles.grid}>
        {categories.map((item) => {
          const builtIn = isRuleCategory(item.key) ? item.key : null
          return (
            <li key={categorySlug(item)}>
              <Link
                to={categoryPath(item)}
                state={{ from: 'rules' }}
                className={styles.tile}
                data-category={builtIn ?? undefined}
              >
                <span className={styles.tileIcon}>
                  <CategoryIcon category={builtIn} />
                </span>
                <strong>{item.name}</strong>
                {builtIn && <small>{t(`rules.topics.${builtIn}`)}</small>}
                {!item.translated && (
                  <Tag tone="warning">{t('rules.translationPending')}</Tag>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </QueryState>
  )
}
