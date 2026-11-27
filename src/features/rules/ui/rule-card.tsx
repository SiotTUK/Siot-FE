import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Tag } from '@/shared/ui/page'
import type { Rule } from '../rules'
import { RuleIcon } from './rule-icon'
import styles from './rules.module.css'

/**
 * Figma v2 rule card (생활 수칙 · 분야): icon, title, summary and tags, ›.
 * Tags come from the content itself ("과태료 있음" when the penalty is a fine).
 */
export function RuleCard({ rule }: { rule: Rule }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/rules/${rule.code}`}
      state={{ from: 'rules' }}
      className={styles.ruleCard}
    >
      <span className={styles.ruleIcon}>
        <RuleIcon code={rule.code} category={rule.category} />
      </span>
      <span className={styles.ruleText}>
        <strong>{rule.title}</strong>
        <small>{rule.summary}</small>
        {rule.fine && (
          <span className={styles.tags}>
            <Tag tone="danger">{t('rules.fineTag')}</Tag>
          </span>
        )}
      </span>
      <span className={styles.chevron} aria-hidden="true">
        ›
      </span>
    </Link>
  )
}
