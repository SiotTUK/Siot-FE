import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonLink } from '@/shared/ui/button'
import { Muted, Section } from '@/shared/ui/page'
import { useEventRecommendations } from '../use-events'
import { EventCard } from './event-card'
import { EventSubscription } from './event-subscription'
import { EventQueryNotice } from './event-query-notice'
import styles from './event-recommendations.module.css'

export function EventRecommendations({
  memberId,
  showAllLink = false,
}: {
  memberId: number
  showAllLink?: boolean
}) {
  const { t } = useTranslation()
  const query = useEventRecommendations(memberId)
  const recommendations = query.data
  const [openEventId, setOpenEventId] = useState<number>()

  return (
    <Section
      title={t('events.recommendations')}
      action={
        showAllLink && (
          <ButtonLink variant="text" to="/events">
            {t('events.viewAll')}
          </ButtonLink>
        )
      }
    >
      {!recommendations && (query.isPending || query.isError) ? (
        <EventQueryNotice
          pending={query.isPending}
          fetching={query.isFetching}
          retry={() => void query.refetch()}
        />
      ) : recommendations?.length ? (
        <ul className={styles.carousel}>
          {recommendations.map(({ event, reasons }) => (
            <li key={event.eventId}>
              <EventCard event={event} reasons={reasons} />
              <Button
                variant="secondary"
                aria-expanded={openEventId === event.eventId}
                onClick={() =>
                  setOpenEventId(
                    openEventId === event.eventId ? undefined : event.eventId,
                  )
                }
              >
                {t('events.reminder.title')}
              </Button>
              {openEventId === event.eventId && (
                <EventSubscription
                  key={memberId}
                  event={event}
                  memberId={memberId}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Muted>{t('events.noRecommendations')}</Muted>
      )}
    </Section>
  )
}
