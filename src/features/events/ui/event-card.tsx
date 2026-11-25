import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import { koreaToday } from '@/shared/i18n/format'
import type { EventSummary } from '../api'
import { formatEventDates } from '../event-display'
import { EventImage } from './event-image'
import { eventMessages } from '../messages'
import styles from './event-card.module.css'

export function EventCard({
  event,
  reasons,
}: {
  event: EventSummary
  reasons?: string[]
}) {
  const { t } = useTranslation()
  const { pathname, search } = useLocation()
  const dates = formatEventDates(event, currentLanguage())
  const today = koreaToday()
  const endDate = event.endsOn ?? event.startsOn
  const status =
    event.startsOn && endDate && endDate >= today
      ? event.startsOn <= today
        ? 'ongoing'
        : 'planned'
      : undefined

  const content = (
    <div className={styles.caption}>
      <h3 lang={event.language}>{event.title}</h3>
      <p>{dates ?? t('events.dateUnknown')}</p>
      {event.venue && <p lang={event.language}>{event.venue}</p>}
    </div>
  )

  return (
    <Link
      className={styles.card}
      data-featured={Boolean(reasons)}
      to={`/events/${event.eventId}`}
      state={{ from: pathname + search }}
    >
      <div className={styles.art}>
        <EventImage url={event.thumbnailUrl} />
        {status && (
          <span className={styles.status}>{t(`events.${status}`)}</span>
        )}
        {reasons && content}
      </div>
      {reasons ? (
        <ul className={styles.reasons}>
          {reasons
            .filter((reason) =>
              Object.hasOwn(eventMessages.ko.events.reasons, reason),
            )
            .map((reason) => (
              <li key={reason}>{t(`events.reasons.${reason}`)}</li>
            ))}
          {!event.translated && <li>{t('events.translationPending')}</li>}
        </ul>
      ) : (
        <>
          {content}
          {!event.translated && (
            <p className={styles.translation}>
              {t('events.translationPending')}
            </p>
          )}
        </>
      )}
    </Link>
  )
}
