import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonLink } from '@/shared/ui/button'
import { Muted, Section } from '@/shared/ui/page'
import { useEventRecommendations, useSavedEventIds } from '../use-events'
import { EventCard } from './event-card'
import { EventQueryNotice } from './event-query-notice'
import styles from './event-recommendations.module.css'

/**
 * "나에게 맞는 행사". Home shows a carousel of cards (Figma v2 H1); the events
 * screen shows one large card at a time with position dots under it (M12).
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
  const listRef = useRef<HTMLUListElement>(null)
  const [current, setCurrent] = useState(0)

  // The card whose left edge is nearest the list's left edge is the one shown.
  const trackCurrent = () => {
    const list = listRef.current
    if (!list) return
    const items = Array.from(list.children) as HTMLElement[]
    const nearest = items.reduce(
      (best, item, index) =>
        Math.abs(item.offsetLeft - list.offsetLeft - list.scrollLeft) <
        Math.abs(items[best].offsetLeft - list.offsetLeft - list.scrollLeft)
          ? index
          : best,
      0,
    )
    setCurrent(nearest)
  }

  const content =
    !recommendations && (query.isPending || query.isError) ? (
      <EventQueryNotice
        pending={query.isPending}
        fetching={query.isFetching}
        retry={() => void query.refetch()}
      />
    ) : recommendations?.length ? (
      <ul
        ref={listRef}
        className={styles[layout]}
        onScroll={layout === 'featured' ? trackCurrent : undefined}
      >
        {recommendations.map(({ event }) => (
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

  if (layout === 'featured') {
    const count = recommendations?.length ?? 0
    return (
      <div className={styles.featuredArea}>
        {content}
        {count > 1 && (
          <div
            className={styles.dots}
            role="group"
            aria-label={t('events.carousel.label')}
          >
            {recommendations?.map(({ event }, index) => (
              <button
                key={event.eventId}
                type="button"
                className={styles.dot}
                aria-label={t('events.carousel.slide', { current: index + 1 })}
                aria-current={
                  index === Math.min(current, count - 1) ? 'true' : undefined
                }
                onClick={() => {
                  const item = listRef.current?.children[index]
                  item?.scrollIntoView({
                    behavior: window.matchMedia(
                      '(prefers-reduced-motion: reduce)',
                    ).matches
                      ? 'auto'
                      : 'smooth',
                    block: 'nearest',
                    inline: 'start',
                  })
                  setCurrent(index)
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
  return (
    <Section
      title={t('events.recommendations')}
      action={
        showAllLink && (
          <ButtonLink variant="text" className={styles.viewAll} to="/events">
            {t('events.viewAll')}
          </ButtonLink>
        )
      }
    >
      {content}
    </Section>
  )
}
