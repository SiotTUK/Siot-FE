import { useTranslation } from 'react-i18next'
import { ButtonLink } from '@/shared/ui/button'
import { Muted, Section } from '@/shared/ui/page'
import { useEventRecommendations } from '../use-events'
import { EventCard } from './event-card'
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
      {query.isPending || query.isError ? (
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
            </li>
          ))}
        </ul>
      ) : (
        <Muted>{t('events.noRecommendations')}</Muted>
      )}
    </Section>
  )
}
