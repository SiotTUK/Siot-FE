import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { ChecklistItemResponse } from '../api'
import { deadlineText, lifeChangeOf, reasonOf } from '../checklist'
import styles from './checklist.module.css'

/**
 * One checklist row (Figma v2): checkbox, life-change chip and title, one
 * line under it, and the server's D-day on the right. The title opens the
 * detail screen, where "해당 없음" now lives.
 * - `home`: the line is "기한 문구 · 장소"
 * - `lifeChange` (F06b): the line is the summary, plus why the task shows
 *   ("자차가 있어서 보여요"); no life-change chip, since every row shares it
 */
export function ChecklistCard({
  item,
  busy,
  onToggleDone,
  context = 'home',
}: {
  item: ChecklistItemResponse
  busy: boolean
  onToggleDone: () => void
  context?: 'home' | 'lifeChange'
}) {
  const { t } = useTranslation()
  const checkable = item.itemType !== 'INFO'
  const notApplicable = item.status === 'NOT_APPLICABLE'
  const overdue = item.status === 'OVERDUE'
  const dDayText = deadlineText(item, t('checklist.pastDeadline'))
  const badge =
    dDayText ?? (item.itemType === 'INFO' ? t('checklist.infoBadge') : null)
  const lifeChange = context === 'home' ? lifeChangeOf(item) : undefined
  // Unknown codes get no chip or reason rather than a raw key.
  const lifeChangeTag = lifeChange
    ? t(`checklist.lifeChangeTag.${lifeChange}`, { defaultValue: '' })
    : ''
  const reason = context === 'lifeChange' ? reasonOf(item) : undefined
  const line =
    context === 'lifeChange'
      ? item.summary
      : [item.badge, item.place].filter(Boolean).join(' · ')

  return (
    <article
      className={styles.card}
      data-status={item.status}
      data-highlighted={item.highlighted}
    >
      {checkable ? (
        <input
          type="checkbox"
          className={styles.check}
          checked={item.status === 'DONE'}
          disabled={busy || notApplicable}
          aria-label={`${item.title} ${t('checklist.done')}`}
          onChange={onToggleDone}
        />
      ) : (
        <span className={styles.checkSpace} aria-hidden="true" />
      )}
      <div className={styles.body}>
        <Link
          to={`/home/checklist/${encodeURIComponent(item.code)}`}
          className={styles.titleLink}
        >
          {lifeChangeTag && (
            <span className={styles.chip}>{lifeChangeTag}</span>
          )}
          <h3 className={styles.title}>{item.title}</h3>
        </Link>
        {line && <p className={styles.text}>{line}</p>}
        {reason && (
          <p className={styles.reason}>{t(`checklist.reasons.${reason}`)}</p>
        )}
        {notApplicable && (
          <p className={styles.meta}>{t('checklist.notApplicable')}</p>
        )}
        {overdue && (
          <p className={styles.overdue} role="note">
            {t('checklist.overdue')}
          </p>
        )}
      </div>
      {badge && (
        <span
          className={styles.dDay}
          data-overdue={overdue}
          data-info={!dDayText || undefined}
        >
          {badge}
        </span>
      )}
    </article>
  )
}
