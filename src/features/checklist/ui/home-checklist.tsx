import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatMonthDay } from '@/shared/i18n/format'
import { FormError, Muted, Section, Stack, Tag } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { ChecklistItemResponse } from '../api'
import { groupItems, nextMark, pickDeadlineAlert } from '../checklist'
import { useChecklist, useMarkChecklistItem } from '../use-checklist'
import { ChecklistCard } from './checklist-card'
import styles from './checklist.module.css'

/** Home top: "나에게 필요한 할 일 N개", progress and the nearest-deadline alert. */
export function ChecklistProgress() {
  const { t } = useTranslation()
  const language = currentLanguage()
  const { data } = useChecklist(language)
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
            dDay: alert.dDayText ?? '',
            date: formatMonthDay(alert.deadline, language),
          })}
        </div>
      )}
    </>
  )
}

/** "내 체크리스트" cards, then optional "생활 준비" folded. */
export function ChecklistSection() {
  const { t } = useTranslation()
  const language = currentLanguage()
  const checklist = useChecklist(language)
  const mark = useMarkChecklistItem(language)
  const [showOptional, setShowOptional] = useState(false)
  const { main, optional } = groupItems(checklist.data?.items ?? [])

  const card = (item: ChecklistItemResponse) => (
    <li key={`${item.code}:${item.periodKey}`}>
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
