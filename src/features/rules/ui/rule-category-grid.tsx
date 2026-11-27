import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ruleCategories } from '../rules'
import { CategoryIcon } from './category-icon'
import styles from './rules.module.css'

/**
 * Figma v2 M06 "분야별 안내": 3×2 tiles (tinted icon, name, topics). A tile
 * opens that category's screen (`/rules/category/:category`).
 */
export function RuleCategoryGrid() {
  const { t } = useTranslation()
  return (
    <ul className={styles.grid}>
      {ruleCategories.map((category) => (
        <li key={category}>
          <Link
            to={`/rules/category/${category}`}
            state={{ from: 'rules' }}
            className={styles.tile}
            data-category={category}
          >
            <span className={styles.tileIcon}>
              <CategoryIcon category={category} />
            </span>
            <strong>{t(`rules.categories.${category}`)}</strong>
            <small>{t(`rules.topics.${category}`)}</small>
          </Link>
        </li>
      ))}
    </ul>
  )
}
