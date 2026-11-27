import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatMonthDay } from '@/shared/i18n/format'
import { FormError, Muted, Section, Stack, Tag } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { ChecklistItemResponse } from '../api'
import {
  checklistItemKey,
  deadlineText,
  groupItems,
  keepOrder,
  nextMark,
  pickDeadlineAlert,
} from '../checklist'
import { useChecklist, useMarkChecklistItem } from '../use-checklist'
import { ChecklistCard } from './checklist-card'
import styles from './checklist.module.css'

/** Home top: "나에게 필요한 할 일 N개", progress and the nearest-deadline alert. */
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
    </>
  )
}

/** "내 체크리스트" cards, then optional "생활 준비" folded. */
export function ChecklistSection({
  memberId,
  guideCode,
}: {
  memberId: number
  guideCode?: string | null
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const checklist = useChecklist(memberId, language)
  const mark = useMarkChecklistItem(memberId, language)
  const [showOptional, setShowOptional] = useState<boolean>()
  const checklistStart = useRef<HTMLDivElement>(null)
  const guideCard = useRef<HTMLLIElement>(null)
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
  const target = guideCode
    ? [...main, ...optional].find((item) => item.code === guideCode)
    : undefined
  const optionalOpen = showOptional ?? target?.itemType === 'OPTIONAL'
  const hasChecklist = !!checklist.data

  useEffect(() => {
    if (!guideCode || !hasChecklist) return
    const element = guideCard.current ?? checklistStart.current
    element?.focus({ preventScroll: true })
    element?.scrollIntoView({ block: 'start' })
  }, [guideCode, hasChecklist])

  const card = (item: ChecklistItemResponse) => (
    <li
      key={checklistItemKey(item)}
      ref={item === target ? guideCard : undefined}
      tabIndex={item === target ? -1 : undefined}
    >
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

  return (
    <div id="checklist" ref={checklistStart} tabIndex={-1}>
      <Section title={t('checklist.title')}>
        <QueryState query={checklist}>
          {mark.isError && <FormError message={errorMessage(t, mark.error)} />}
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
                aria-expanded={optionalOpen}
                onClick={() => setShowOptional(!optionalOpen)}
              >
                <span>
                  {t('checklist.optional', {
                    done: optional.filter((item) => item.status === 'DONE')
                      .length,
                    total: optional.length,
                  })}
                </span>
                <span>
                  {t(optionalOpen ? 'checklist.collapse' : 'checklist.expand')}{' '}
                  {optionalOpen ? '▲' : '▼'}
                </span>
              </button>
              {optionalOpen && (
                <Stack as="ul" gap={10}>
                  {optional.map(card)}
                </Stack>
              )}
            </div>
          )}
        </QueryState>
      </Section>
    </div>
  )
}
