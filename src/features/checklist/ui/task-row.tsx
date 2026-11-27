import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tag } from '@/shared/ui/page'
import type { ChecklistItemResponse } from '../api'
import { deadlineText } from '../checklist'
import { GuideDetail } from './guide-detail'
import styles from './task-row.module.css'

/**
 * Figma v2 home task row: checkbox, (life-change tag) title, one short line
 * and the D-day chip. Tapping the text opens the guide (GuideDetail) and
 * "해당 없음". INFO items have no checkbox.
 */
export function TaskRow({
  item,
  tag,
  busy,
  onToggleDone,
  onToggleNotApplicable,
}: {
  item: ChecklistItemResponse
  /** Short life-change name ("이사") for a life-change task. */
  tag?: string
  busy: boolean
  onToggleDone: () => void
  onToggleNotApplicable: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const detailId = useId()
  const checkable = item.itemType !== 'INFO'
  const notApplicable = item.status === 'NOT_APPLICABLE'
  const overdue = item.status === 'OVERDUE'
  const dDayText = deadlineText(item, t('checklist.pastDeadline'))
  const brief = [item.badge, item.place].filter(Boolean).join(' · ')
  const line = brief || item.summary

  return (
    <article
      className={styles.row}
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
        <span aria-hidden="true" />
      )}
      <button
        type="button"
        className={styles.main}
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.titleLine}>
          {tag && <Tag tone="main">{tag}</Tag>}
          {item.hasNoticeChanged && (
            <Tag tone="warning">{t('checklist.noticeChanged')}</Tag>
          )}
          <strong className={styles.title}>{item.title}</strong>
        </span>
        {line && <span className={styles.line}>{line}</span>}
      </button>
      {dDayText && (
        <span className={styles.dDay} data-overdue={overdue}>
          {dDayText}
        </span>
      )}
      <div id={detailId} className={styles.detail} hidden={!open}>
        <GuideDetail item={item} />
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
