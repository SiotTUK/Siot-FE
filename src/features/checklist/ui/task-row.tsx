import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Tag } from '@/shared/ui/page'
import type { ChecklistItemResponse } from '../api'
import {
  deadlineText,
  dueSoon,
  lifeChangeOf,
  reasonOf,
  translationPending,
} from '../checklist'
import { GuideDetail } from './guide-detail'
import styles from './task-row.module.css'

/**
 * Figma v2 home task row: checkbox, life-change chip ("이사"), title, one
 * short line and the D-day chip. Tapping the text opens the guide
 * (GuideDetail), a link to the checklist detail screen and "해당 없음".
 * INFO items have no checkbox.
 */
export function TaskRow({
  item,
  showLifeChange = true,
  busy,
  onToggleDone,
  onToggleNotApplicable,
}: {
  item: ChecklistItemResponse
  /** Off on the life change's own screen, where every task has the same chip. */
  showLifeChange?: boolean
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
  const lifeChange = showLifeChange ? lifeChangeOf(item) : undefined
  // On the life change's own screen (F06b): "자차가 있어서 보여요" (#31).
  const reason = showLifeChange ? undefined : reasonOf(item)
  // Unknown life-change codes get no chip rather than a raw key.
  const tag = lifeChange
    ? t(`checklist.lifeChangeTag.${lifeChange}`, { defaultValue: '' })
    : ''

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
          disabled={notApplicable}
          aria-disabled={busy || undefined}
          aria-busy={busy || undefined}
          aria-label={`${item.title} ${t('checklist.done')}`}
          onChange={() => {
            if (!busy) onToggleDone()
          }}
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
          {dueSoon(item) && <Tag tone="warning">{t('checklist.dueSoon')}</Tag>}
          {translationPending(item) && (
            <Tag>{t('checklist.translationPending')}</Tag>
          )}
          {item.hasNoticeChanged && (
            <Tag tone="warning">{t('checklist.noticeChanged')}</Tag>
          )}
          <strong className={styles.title}>{item.title}</strong>
        </span>
        {line && <span className={styles.line}>{line}</span>}
        {reason && (
          <span className={styles.reason}>
            {t(`checklist.reasons.${reason}`)}
          </span>
        )}
      </button>
      {dDayText && (
        <span className={styles.dDay} data-overdue={overdue}>
          {dDayText}
        </span>
      )}
      <div id={detailId} className={styles.detail} hidden={!open}>
        <GuideDetail item={item} placeShown={Boolean(brief && item.place)} />
        <Link
          to={`/home/checklist/${encodeURIComponent(item.code)}`}
          className={styles.detailLink}
        >
          {t('checklist.viewDetail')} ›
        </Link>
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
