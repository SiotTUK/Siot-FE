import { useTranslation } from 'react-i18next'
import { ButtonLink } from '@/shared/ui/button'
import { Muted, Section } from '@/shared/ui/page'
import { useEventRecommendations, useSavedEventIds } from '../use-events'
import { EventCard } from './event-card'
import { EventQueryNotice } from './event-query-notice'
import styles from './event-recommendations.module.css'

/**
 * "나에게 맞는 행사". Home shows a carousel of cards (Figma v2 H1); the events
 * screen shows the first recommendation as one large card (M12).
 */
export function EventRecommendations({
  memberId,
  layout = 'carousel',
  showAllLink = false,
}: {
  memberId: number
  layout?: 'carousel' | 'featured'
  showAllLink?: boolean
}) {
  const { t } = useTranslation()
  const query = useEventRecommendations(memberId)
  const saved = useSavedEventIds(memberId)
  const recommendations = query.data
  const shown =
    layout === 'featured' ? recommendations?.slice(0, 1) : recommendations

  const content =
    !recommendations && (query.isPending || query.isError) ? (
      <EventQueryNotice
        pending={query.isPending}
        fetching={query.isFetching}
        retry={() => void query.refetch()}
      />
    ) : shown?.length ? (
      <ul className={styles[layout]}>
        {shown.map(({ event }) => (
          <li key={event.eventId}>
            <EventCard
              event={event}
              memberId={memberId}
              saved={saved.has(event.eventId)}
              variant={layout}
            />
          </li>
        ))}
      </ul>
    ) : layout === 'carousel' ? (
      <Muted>{t('events.noRecommendations')}</Muted>
    ) : null

  if (layout === 'featured') return content
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
      {content}
    </Section>
  )
}
