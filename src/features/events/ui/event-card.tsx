import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import type { EventSummary } from '../api'
import { eventStatus, formatEventDates, soonDays } from '../event-display'
import { EventHeart } from './event-heart'
import { EventImage } from './event-image'
import styles from './event-card.module.css'

/**
 * Figma v2 event cards, each with a ♥ beside the link:
 * - `carousel`: picture on top, status badge, title, date · place (home)
 * - `featured`: the large "진행 중 · 나에게 추천" card (events screen)
 * - `row`: square picture, badge, title, date · place (all events list)
 * The meta line starts with the category (EVE-10, #37).
 */
export function EventCard({
  event,
  memberId,
  saved,
  variant,
}: {
  event: EventSummary
  memberId: number
  saved: boolean
  variant: 'carousel' | 'featured' | 'row'
}) {
  const { t } = useTranslation()
  const { pathname, search } = useLocation()
  const status = eventStatus(event)
  const meta = [
    event.categoryName,
    formatEventDates(event, currentLanguage()) ?? t('events.dateUnknown'),
    event.venue,
  ]
    .filter(Boolean)
    .join(' · ')
  // zh·vi say "starts within 7 days": their "soon" and "planned" read alike.
  const statusText = status && t(`events.${status}`, { days: soonDays })
  const badge = statusText && (
    <span className={styles.status}>
      {variant === 'featured'
        ? `${statusText} · ${t('events.recommended')}`
        : statusText}
    </span>
  )

  return (
    <article className={styles.card} data-variant={variant}>
      <Link
        className={styles.link}
        to={`/events/${event.eventId}`}
        state={{ from: pathname + search }}
      >
        <div className={styles.art} data-tone={event.eventId % 4}>
          <EventImage url={event.thumbnailUrl} />
          {variant !== 'row' && badge}
        </div>
        <div className={styles.body}>
          {variant === 'row' && badge}
          <h3 lang={event.language}>{event.title}</h3>
          <p lang={event.language}>{meta}</p>
          {!event.translated && (
            <p className={styles.translation}>
              {t('events.translationPending')}
            </p>
          )}
        </div>
      </Link>
      <div className={styles.heart}>
        <EventHeart
          memberId={memberId}
          eventId={event.eventId}
          saved={saved}
          title={event.title}
        />
      </div>
    </article>
  )
}
