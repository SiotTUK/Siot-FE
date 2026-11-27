import { useState } from 'react'
import { useTranslation } from 'react-i18next'
// The hug art is transparent; haero-toro.png has the canvas color baked in.
import haeroToro from '@/shared/assets/mascot/haero-toro-hug.png'
import toro from '@/shared/assets/mascot/toro.png'
import { currentLanguage } from '@/shared/i18n'
import { formatLongMonthDay, formatYearMonth } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { ChevronRightIcon } from '@/shared/ui/icons'
import { FormError, Muted, Section } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { ChecklistItemResponse } from '../api'
import {
  checklistItemKey,
  deadlineText,
  groupItems,
  keepOrder,
  markErrorMessage,
  nextMark,
  pickDeadlineAlert,
  pickNextItem,
} from '../checklist'
import { useChecklist, useMarkChecklistItem } from '../use-checklist'
import { ChecklistCard } from './checklist-card'
import styles from './checklist.module.css'

/**
 * Home top card (Figma v2). H1: the nearest deadline within 30 days in a
 * blue card with progress and 토로. H2 (nothing due within 30 days): "지금
 * 급한 할 일은 없어요" with the month of the next deadline.
 */
export function HomeTopCard({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const { data } = useChecklist(memberId, language)
  if (!data) return null
  const alert = pickDeadlineAlert(data.items)
  const done = t('checklist.progressDone', {
    done: data.completedRequiredCount,
    total: data.totalRequiredCount,
  })

  if (!alert) {
    const next = pickNextItem(data.items)
    return (
      <div className={styles.calm}>
        <div>
          {next?.deadline && (
            <span>
              {t('checklist.nextMonth', {
                month: formatYearMonth(next.deadline, language),
              })}
            </span>
          )}
          <h1>{t('checklist.calmTitle')}</h1>
        </div>
        <img src={haeroToro} alt="" width={84} height={81} />
      </div>
    )
  }

  const overdue = alert.dDay !== null && alert.dDay < 0
  return (
    <div className={styles.top}>
      <div className={styles.topText}>
        <span>
          {t('checklist.dueLine', {
            title: alert.title,
            dDay: deadlineText(alert, t('checklist.pastDeadline')) ?? '',
          })}
        </span>
        <h1>
          {overdue
            ? t('checklist.overdueTitle')
            : t('checklist.dueBy', {
                date: alert.deadline
                  ? formatLongMonthDay(alert.deadline, language)
                  : '',
              })}
        </h1>
        <div className={styles.progressRow}>
          <progress
            max={100}
            value={data.progressPercentage}
            aria-label={done}
          />
          <strong>{done}</strong>
        </div>
      </div>
      <img src={toro} alt="" width={80} height={80} />
    </div>
  )
}

/**
 * "나에게 필요한 할 일 N" rows in one card, then "생활 준비 (선택) N개 더 ›".
 * `calm` (H2) shrinks it to the "다음 할 일" row, with "전체 보기".
 */
export function ChecklistSection({
  memberId,
  calm = false,
}: {
  memberId: number
  calm?: boolean
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const checklist = useChecklist(memberId, language)
  const mark = useMarkChecklistItem(memberId, language)
  const [showOptional, setShowOptional] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [shownKeys, setShownKeys] = useState<string[]>([])
  const items = checklist.data ? keepOrder(checklist.data.items, shownKeys) : []
  const nextKeys = items.map(checklistItemKey)
  if (
    checklist.data &&
    (nextKeys.length !== shownKeys.length ||
      nextKeys.some((key, index) => key !== shownKeys[index]))
  ) {
    setShownKeys(nextKeys)
  }
  const { main, optional } = groupItems(items)
  const next = calm ? pickNextItem(items) : undefined
  const compact = next !== undefined && !showAll

  const row = (item: ChecklistItemResponse) => (
    <li key={checklistItemKey(item)}>
      <ChecklistCard
        item={item}
        busy={mark.isPending}
        onToggleDone={() =>
          mark.mutate({ item, mark: nextMark(item, 'toggleDone') })
        }
      />
    </li>
  )

  const toggleAll = next && (
    <Button
      variant="text"
      aria-expanded={showAll}
      onClick={() => setShowAll((value) => !value)}
    >
      {t(showAll ? 'checklist.showNext' : 'checklist.showAll')}
    </Button>
  )
  const error = mark.isError && (
    <FormError message={markErrorMessage(t, mark.error)} />
  )

  if (compact)
    return (
      <Section title={t('checklist.nextTitle')} action={toggleAll}>
        {error}
        <ul className={styles.list}>{row(next)}</ul>
      </Section>
    )

  return (
    <Section
      title={t('checklist.homeTitle', {
        count: checklist.data?.totalRequiredCount ?? main.length,
      })}
      action={toggleAll}
    >
      <QueryState query={checklist}>
        {error}
        {main.length === 0 && optional.length === 0 ? (
          <Muted>{t('checklist.empty')}</Muted>
        ) : (
          <ul className={styles.list}>
            {main.map(row)}
            {showOptional && optional.map(row)}
            {optional.length > 0 && (
              <li>
                <button
                  type="button"
                  className={styles.more}
                  aria-expanded={showOptional}
                  onClick={() => setShowOptional((value) => !value)}
                >
                  {showOptional
                    ? t('checklist.optionalLess')
                    : t('checklist.optionalMore', { count: optional.length })}
                  <ChevronRightIcon data-open={showOptional} />
                </button>
              </li>
            )}
          </ul>
        )}
      </QueryState>
    </Section>
  )
}
