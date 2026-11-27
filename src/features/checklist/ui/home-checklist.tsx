import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { currentLanguage } from '@/shared/i18n'
import { ChevronRightIcon } from '@/shared/ui/icons'
import { FormError, Muted, Section } from '@/shared/ui/page'
import { QueryState } from '@/shared/ui/query-state'
import type { ChecklistItemResponse } from '../api'
import {
  checklistItemKey,
  groupItems,
  keepOrder,
  markErrorMessage,
  nextMark,
  openRequiredCount,
} from '../checklist'
import { useChecklist, useMarkChecklistItem } from '../use-checklist'
import { TaskRow } from './task-row'
import styles from './checklist.module.css'

/**
 * Figma v2 home task list in one white card: "나에게 필요한 할 일 N" (H1) or
 * "다음 할 일" (H2), then "생활 준비 (선택) N개 더" folded.
 */
export function ChecklistSection({
  memberId,
  calm = false,
  tagFor,
}: {
  memberId: number
  /** H2 (nothing urgent): titled "다음 할 일". */
  calm?: boolean
  /** Short life-change name for a life-change task row ("이사"). */
  tagFor?: (item: ChecklistItemResponse) => string | undefined
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const checklist = useChecklist(memberId, language)
  const mark = useMarkChecklistItem(memberId, language)
  const [showOptional, setShowOptional] = useState(false)
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

  const row = (item: ChecklistItemResponse) => (
    <li key={checklistItemKey(item)}>
      <TaskRow
        item={item}
        tag={tagFor?.(item)}
        busy={mark.isSaving(item)}
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
    <Section
      title={
        calm
          ? t('checklist.nextTitle')
          : t('checklist.needTitle', { count: openRequiredCount(items) })
      }
    >
      <QueryState query={checklist}>
        {mark.isError && (
          <FormError message={markErrorMessage(t, mark.error)} />
        )}
        {main.length === 0 && optional.length === 0 ? (
          <Muted>{t('checklist.empty')}</Muted>
        ) : (
          <div className={styles.list}>
            <ul>
              {main.map(row)}
              {showOptional && optional.map(row)}
            </ul>
            {optional.length > 0 && (
              <button
                type="button"
                className={styles.more}
                aria-expanded={showOptional}
                onClick={() => setShowOptional((value) => !value)}
              >
                {showOptional
                  ? t('checklist.lessOptional')
                  : t('checklist.moreOptional', { count: optional.length })}
                <ChevronRightIcon
                  className={styles.moreIcon}
                  data-open={showOptional}
                />
              </button>
            )}
          </div>
        )}
      </QueryState>
    </Section>
  )
}
