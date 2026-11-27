import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { currentLanguage } from '@/shared/i18n'
import { formatLongMonthDay, formatYearMonth } from '@/shared/i18n/format'
import { MascotImage } from '@/shared/ui/mascot-image'
import type { ChecklistSummaryResponse } from '../api'
import { deadlineText, homeHero } from '../checklist'
import styles from './home-hero.module.css'

/**
 * Figma v2 home hero. H1: the nearest deadline within 30 days on a blue card
 * ("11월 18일까지 준비하세요", progress, 토로). H2: "지금 급한 할 일은
 * 없어요" with the month of the next deadline.
 *
 * One card for both, so a check that changes it eases over: the colour
 * fades, the new text fades in (not on first load) and the bar fills.
 */
export function HomeHero({
  checklist,
}: {
  checklist: ChecklistSummaryResponse
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const hero = homeHero(checklist.items)
  const contentKey = hero.kind === 'urgent' ? hero.item.code : 'calm'
  const overdue =
    hero.kind === 'urgent' && hero.item.dDay !== null && hero.item.dDay < 0
  const [shownKey, setShownKey] = useState(contentKey)
  const [changed, setChanged] = useState(false)
  if (contentKey !== shownKey) {
    setShownKey(contentKey)
    setChanged(true)
  }
  const progress = t('checklist.progressDone', {
    done: checklist.completedRequiredCount,
    total: checklist.totalRequiredCount,
  })

  return (
    <section className={styles.hero} data-kind={hero.kind}>
      <div
        key={contentKey}
        className={styles.content}
        data-enter={changed || undefined}
      >
        {hero.kind === 'calm' ? (
          <>
            <div className={styles.text}>
              {hero.next?.deadline && (
                <p className={styles.label}>
                  {t('checklist.calmLabel', {
                    date: formatYearMonth(hero.next.deadline, language),
                  })}
                </p>
              )}
              <h1 className={styles.title}>{t('checklist.calmTitle')}</h1>
            </div>
            <MascotImage pose="hug" height={84} />
          </>
        ) : (
          <>
            <div className={styles.text}>
              <p className={styles.label}>
                {t(
                  overdue
                    ? 'checklist.heroLabelOverdue'
                    : 'checklist.heroLabel',
                  {
                    title: hero.item.title,
                    dDay:
                      deadlineText(hero.item, t('checklist.pastDeadline')) ??
                      '',
                  },
                )}
              </p>
              <h1 className={styles.title}>
                {overdue || !hero.item.deadline
                  ? t('checklist.heroOverdue')
                  : t('checklist.heroDue', {
                      date: formatLongMonthDay(hero.item.deadline, language),
                    })}
              </h1>
            </div>
            <MascotImage pose="toro" height={116} />
          </>
        )}
      </div>
      {hero.kind === 'urgent' && (
        <div className={styles.progress}>
          <div
            className={styles.bar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={checklist.progressPercentage}
            aria-label={progress}
          >
            <span style={{ width: `${checklist.progressPercentage}%` }} />
          </div>
          <span>{progress}</span>
        </div>
      )}
    </section>
  )
}
