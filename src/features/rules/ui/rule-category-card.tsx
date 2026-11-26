import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { RuleGroup } from '../rules'
import { CategoryIcon } from './category-icon'
import styles from './rules.module.css'

/**
 * 분야별 안내 card: icon, name and topics with a ▼; open = blue border,
 * rule rows with ›, and "○○ 전체 보기 →" that switches to that category.
 */
export function RuleCategoryCard({
  group,
  defaultOpen,
  onViewAll,
}: {
  group: RuleGroup
  defaultOpen?: boolean
  onViewAll?: () => void
}) {
  const { t } = useTranslation()
  const name = t(`rules.groups.${group.category}`)
  return (
    <details className={styles.category} open={defaultOpen}>
      <summary>
        <span className={styles.categoryIcon}>
          <CategoryIcon category={group.category} />
        </span>
        <span className={styles.categoryText}>
          <strong>{name}</strong>
          <small>{t(`rules.topics.${group.category}`)}</small>
        </span>
        <span className={styles.triangle} aria-hidden="true" />
      </summary>
      <ul className={styles.rows}>
        {group.rules.map((rule) => (
          <li key={rule.code}>
            <Link to={`/rules/${rule.code}`} state={{ from: 'rules' }}>
              {rule.title}
              <span aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>
      {onViewAll && (
        <button type="button" className={styles.viewAll} onClick={onViewAll}>
          {t('rules.viewAll', { category: name })}
          <span aria-hidden="true"> →</span>
        </button>
      )}
    </details>
  )
}
