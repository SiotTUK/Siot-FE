import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import { pickTaxRound, taxDetailPath } from '../taxes'
import { useTaxDetail, useTaxSchedules } from '../use-taxes'
import styles from './tax-detail-link.module.css'

/**
 * "세금 상세 보기" on a tax rule (BE #29) or a translated tax bill (#34).
 * With a `scheduleId` (the bill's `taxScheduleId`: the round its due date
 * falls in) it opens that round. Otherwise it finds the rounds of
 * `taxKind` with `?kind=` and opens the first whose deadline has not
 * passed, else the latest. Nothing shows without either, while loading, on
 * error, or when there is no round.
 */
export function TaxDetailLink({
  taxKind,
  scheduleId,
}: {
  taxKind: string | null | undefined
  scheduleId?: number | null
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const direct = scheduleId ?? undefined
  const detail = useTaxDetail(
    direct ?? 0,
    language,
    'tax',
    direct !== undefined,
  )
  const rounds = useTaxSchedules(
    direct === undefined ? (taxKind ?? undefined) : undefined,
    language,
  )
  const round =
    direct !== undefined
      ? detail.data
      : rounds.data && pickTaxRound(rounds.data)
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
