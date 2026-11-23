import { useTranslation } from 'react-i18next'
import { currentLanguage } from '@/shared/i18n'
import { formatMonthDay } from '@/shared/i18n/format'
import { Tag } from '@/shared/ui/page'
import type { ChecklistItemResponse } from '../api'
import { deadlineText } from '../checklist'
import styles from './checklist.module.css'

/**
 * One checklist item (H1·H2 card): checkbox, badge, title, summary, law,
 * the server's D-day text and "해당 없음". INFO items have no checkbox.
 */
export function ChecklistCard({
  item,
  busy,
  onToggleDone,
  onToggleNotApplicable,
}: {
  item: ChecklistItemResponse
  busy: boolean
  onToggleDone: () => void
  onToggleNotApplicable: () => void
}) {
  const { t } = useTranslation()
  const checkable = item.itemType !== 'INFO'
  const notApplicable = item.status === 'NOT_APPLICABLE'
  const overdue = item.status === 'OVERDUE'
  const dDayText = deadlineText(item, t('checklist.pastDeadline'))

  return (
    <article
      className={styles.card}
      data-status={item.status}
      data-highlighted={item.highlighted}
    >
      {checkable && (
        <input
          type="checkbox"
          className={styles.check}
          checked={item.status === 'DONE'}
          disabled={busy || notApplicable}
          aria-label={`${item.title} ${t('checklist.done')}`}
          onChange={onToggleDone}
        />
      )}
      <div className={styles.body}>
        <div className={styles.tags}>
          {item.badge && <Tag>{item.badge}</Tag>}
          {item.hasNoticeChanged && (
            <Tag tone="main">{t('checklist.noticeChanged')}</Tag>
          )}
        </div>
        <h3 className={styles.title}>{item.title}</h3>
        {item.summary && <p className={styles.text}>{item.summary}</p>}
        {item.variantBodies.map((body) => (
          <p key={body} className={styles.text}>
            {body}
          </p>
        ))}
        {item.applyStartsOn && (
          <p className={styles.meta}>
            {t('checklist.applyStarts', {
              date: formatMonthDay(item.applyStartsOn, currentLanguage()),
            })}
          </p>
        )}
        {item.law && <p className={styles.meta}>{item.law}</p>}
        {overdue && (
          <p className={styles.overdue} role="note">
            {t('checklist.overdue')}
          </p>
        )}
      </div>
      <div className={styles.side}>
        {dDayText && (
          <span className={styles.dDay} data-overdue={overdue}>
            {dDayText}
          </span>
        )}
        {checkable && (
          <button
            type="button"
            className={styles.textButton}
            disabled={busy}
            aria-pressed={notApplicable}
            onClick={onToggleNotApplicable}
          >
            {t(
              notApplicable
                ? 'checklist.undoNotApplicable'
                : 'checklist.notApplicable',
            )}
          </button>
        )}
      </div>
    </article>
  )
}
