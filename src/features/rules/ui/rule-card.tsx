import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Tag } from '@/shared/ui/page'
import type { Rule } from '../rules'
import { RuleIcon } from './rule-icon'
import styles from './rules.module.css'

/**
 * Figma v2 rule card (생활 수칙 · 분야): icon, title, summary and tags, ›.
 * Tags: "과태료 있음" when the penalty is a fine, "번역 준비 중" when the text
 * is the Korean original.
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
        {(rule.fine || !rule.translated) && (
          <span className={styles.tags}>
            {rule.fine && <Tag tone="danger">{t('rules.fineTag')}</Tag>}
            {!rule.translated && (
              <Tag tone="warning">{t('rules.translationPending')}</Tag>
            )}
          </span>
        )}
      </span>
      <span className={styles.chevron} aria-hidden="true">
        ›
      </span>
    </Link>
  )
}
