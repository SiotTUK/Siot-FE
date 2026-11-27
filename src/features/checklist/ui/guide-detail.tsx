import { useTranslation } from 'react-i18next'
import { currentLanguage } from '@/shared/i18n'
import { formatMonthDay } from '@/shared/i18n/format'
import { TextLink } from '@/shared/ui/text-link'
import type { ChecklistItemResponse } from '../api'
import styles from './guide-detail.module.css'

/**
 * "방법 보기" body for a checklist or life-change task: only what the server
 * sends (guide text, 준비물, 수수료, place, law, contact). Many items have no
 * guide text yet, so then it says so and points to 1345 / 토로 instead of
 * opening onto nothing. The FE never writes procedures itself.
 */
export function GuideDetail({
  item,
  placeShown = false,
}: {
  item: ChecklistItemResponse
  /** The row already shows the place in its short line. */
  placeShown?: boolean
}) {
  const { t } = useTranslation()
  const guide = [item.summary, item.content, ...item.variantBodies].filter(
    (text): text is string => Boolean(text),
  )
  const facts = [
    !placeShown && item.place && t('checklist.place', { place: item.place }),
    item.docs.length > 0 && t('checklist.docs', { docs: item.docs.join(', ') }),
    item.fee && t('checklist.fee', { fee: item.fee }),
    item.applyStartsOn &&
      t('checklist.applyStarts', {
        date: formatMonthDay(item.applyStartsOn, currentLanguage()),
      }),
    item.law,
  ].filter((text): text is string => Boolean(text))

  return (
    <div className={styles.detail}>
      {guide.map((text, index) => (
        <p key={index} className={styles.guide}>
          {text}
        </p>
      ))}
      {guide.length === 0 && <p>{t('checklist.noGuide')}</p>}
      {facts.map((text, index) => (
        <p key={index} className={styles.meta}>
          {text}
        </p>
      ))}
      {item.contact && (
        <p className={styles.meta}>
          {t('checklist.contact', { contact: item.contact })}
        </p>
      )}
      {item.status === 'OVERDUE' && (
        <p className={styles.overdue} role="note">
          {t('checklist.overdue')}
        </p>
      )}
      {guide.length === 0 && (
        <TextLink to="/chat">{t('checklist.askToro')} ›</TextLink>
      )}
    </div>
  )
}
