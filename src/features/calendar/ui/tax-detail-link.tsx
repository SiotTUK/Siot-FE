import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import { pickTaxRound, ruleTaxKind, taxDetailPath } from '../taxes'
import { useTaxSchedules } from '../use-taxes'
import styles from './tax-detail-link.module.css'

/**
 * "세금 상세 보기" on a tax rule (BE #29): finds the rule's rounds with
 * `?kind=` and opens the first whose deadline has not passed. Nothing shows
 * for other rules, while loading, on error, or when the list is empty.
 */
export function TaxDetailLink({ ruleCode }: { ruleCode: string }) {
  const { t } = useTranslation()
  const kind = ruleTaxKind(ruleCode)
  const rounds = useTaxSchedules(kind, currentLanguage())
  const round = rounds.data && pickTaxRound(rounds.data)
  if (!round) return null
  return (
    <Link className={styles.link} to={taxDetailPath(round.scheduleId)}>
      <span>
        <strong>{t('calendar.tax.open')}</strong>
        <small>{round.title}</small>
      </span>
      <span aria-hidden="true">›</span>
    </Link>
  )
}
