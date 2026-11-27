import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { RuleGroup } from '../rules'
import { CategoryIcon } from './category-icon'
import styles from './rules.module.css'

/**
 * One category's list (opened from a 분야별 안내 tile): tinted icon, name
 * and topics on top, then a row with › per rule.
 */
export function RuleCategoryCard({ group }: { group: RuleGroup }) {
  const { t } = useTranslation()
  return (
    <section className={styles.category} data-category={group.category}>
      <div className={styles.categoryHead}>
        <span className={styles.tileIcon}>
          <CategoryIcon category={group.category} />
        </span>
        <span className={styles.categoryText}>
          <strong>{t(`rules.groups.${group.category}`)}</strong>
          <small>{t(`rules.topics.${group.category}`)}</small>
        </span>
      </div>
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
    </section>
  )
}
