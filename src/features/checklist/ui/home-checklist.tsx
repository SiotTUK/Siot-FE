import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { currentLanguage } from '@/shared/i18n'
import { formatMonthDay, formatYearMonth } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { FormError, Muted, Section, Stack, Tag } from '@/shared/ui/page'
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
 * Home top: "나에게 필요한 할 일 N개", progress and the nearest-deadline alert.
 * With nothing due within 30 days (H2), a calm card with the next month instead.
 */
export function ChecklistProgress({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const { data } = useChecklist(memberId, language)
  if (!data) return null
  const alert = pickDeadlineAlert(data.items)
  return (
    <>
      <div className={styles.progress}>
        <h1>
          {t('checklist.progressTitle', { count: data.totalRequiredCount })}
        </h1>
        <div className={styles.progressRow}>
          <progress
            max={100}
            value={data.progressPercentage}
            aria-label={t('checklist.progressDone', {
              done: data.completedRequiredCount,
              total: data.totalRequiredCount,
            })}
          />
          <strong>
            {t('checklist.progressDone', {
              done: data.completedRequiredCount,
              total: data.totalRequiredCount,
            })}
          </strong>
        </div>
      </div>
      {alert && (
        <div className={styles.alert} role="status">
          <Tag tone="warning">{t('checklist.alertTag')}</Tag>
          {t('checklist.alert', {
            title: alert.title,
            dDay: deadlineText(alert, t('checklist.pastDeadline')) ?? '',
            date: formatMonthDay(alert.deadline, language),
          })}
        </div>
      )}
      {!alert && <CalmCard item={pickNextItem(data.items)} />}
    </>
  )
}

/** H2 top: "지금 급한 할 일은 없어요" and the month of the next deadline. */
function CalmCard({ item }: { item: ChecklistItemResponse | undefined }) {
  const { t } = useTranslation()
  return (
    <div className={styles.calm}>
      {item?.deadline && (
        <span>
          {t('checklist.nextMonth', {
            month: formatYearMonth(item.deadline, currentLanguage()),
          })}
        </span>
      )}
      <strong>{t('checklist.calmTitle')}</strong>
    </div>
  )
}

/**
 * "내 체크리스트" cards, then optional "생활 준비" folded. `calm` (H2: nothing
 * due within 30 days) shrinks it to the "다음 할 일" card, with "전체 보기".
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

  const card = (item: ChecklistItemResponse) => (
    <li key={checklistItemKey(item)}>
      <ChecklistCard
        item={item}
        busy={mark.isPending}
        onToggleDone={() =>
          mark.mutate({ item, mark: nextMark(item, 'toggleDone') })
        }
        onToggleNotApplicable={() =>
          mark.mutate({ item, mark: nextMark(item, 'toggleNotApplicable') })
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

  if (compact)
    return (
      <Section title={t('checklist.nextTitle')} action={toggleAll}>
        {mark.isError && (
          <FormError message={markErrorMessage(t, mark.error)} />
        )}
        <Stack as="ul" gap={10}>
          {card(next)}
        </Stack>
      </Section>
    )

  return (
    <Section title={t('checklist.title')} action={toggleAll}>
      <QueryState query={checklist}>
        {mark.isError && (
          <FormError message={markErrorMessage(t, mark.error)} />
        )}
        {main.length === 0 && optional.length === 0 && (
          <Muted>{t('checklist.empty')}</Muted>
        )}
        <Stack as="ul" gap={10}>
          {main.map(card)}
        </Stack>
        {optional.length > 0 && (
          <div className={styles.optional}>
            <button
              type="button"
              aria-expanded={showOptional}
              onClick={() => setShowOptional((value) => !value)}
            >
              <span>
                {t('checklist.optional', {
                  done: optional.filter((item) => item.status === 'DONE')
                    .length,
                  total: optional.length,
                })}
              </span>
              <span>
                {t(showOptional ? 'checklist.collapse' : 'checklist.expand')}{' '}
                {showOptional ? '▲' : '▼'}
              </span>
            </button>
            {showOptional && (
              <Stack as="ul" gap={10}>
                {optional.map(card)}
              </Stack>
            )}
          </div>
        )}
      </QueryState>
    </Section>
  )
}
