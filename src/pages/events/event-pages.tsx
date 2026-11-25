import { useTranslation } from 'react-i18next'
import {
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { useMe } from '@/features/auth/use-session'
import type { EventDetail } from '@/features/events/api'
import {
  eventLink,
  formatEventDates,
  formatEventTimes,
} from '@/features/events/event-display'
import { EventCard } from '@/features/events/ui/event-card'
import { EventImage } from '@/features/events/ui/event-image'
import { EventQueryNotice } from '@/features/events/ui/event-query-notice'
import { EventRecommendations } from '@/features/events/ui/event-recommendations'
import { useEventDetail, useEvents } from '@/features/events/use-events'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'
import { PageBody } from '@/shared/ui/mobile-frame'
import { Muted, PageHeading, Section, Tag } from '@/shared/ui/page'
import { ScreenHeader } from '@/shared/ui/screen-header'
import styles from './event-pages.module.css'

export function EventsPage() {
  const { t } = useTranslation()
  const { data: member } = useMe()

  return (
    <PageBody className={styles.body}>
      <PageHeading title={t('events.title')} />
      {member && (
        <>
          <EventRecommendations memberId={member.id} />
          <EventList memberId={member.id} />
        </>
      )}
    </PageBody>
  )
}

function EventList({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const requestedPage = Number(params.get('page'))
  const page =
    Number.isInteger(requestedPage) &&
    requestedPage >= 0 &&
    requestedPage <= 2_147_483_647
      ? requestedPage
      : 0
  const query = useEvents(memberId, page)
  const data = query.data
  const lastPage = data ? Math.max(0, data.totalPages - 1) : page

  if (query.isSuccess && page > lastPage) {
    const nextParams = new URLSearchParams(params)
    if (lastPage === 0) nextParams.delete('page')
    else nextParams.set('page', String(lastPage))
    return (
      <Section title={t('events.all')}>
        <EventQueryNotice
          pending
          fetching={query.isFetching}
          retry={() => void query.refetch()}
        />
        {!query.isFetching && (
          <Navigate replace to={{ search: nextParams.toString() }} />
        )}
      </Section>
    )
  }

  return (
    <Section title={t('events.all')}>
      {query.isPending || query.isError ? (
        <EventQueryNotice
          pending={query.isPending}
          fetching={query.isFetching}
          retry={() => void query.refetch()}
        />
      ) : data?.content.length ? (
        <ul className={styles.grid}>
          {data.content.map((event) => (
            <li key={event.eventId}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      ) : (
        <Muted>{t('events.empty')}</Muted>
      )}
      {data && (page > 0 || data.hasNext) && (
        <div className={styles.pager}>
          <Button
            variant="secondary"
            disabled={page === 0}
            onClick={() =>
              setParams(page === 1 ? {} : { page: String(page - 1) })
            }
          >
            {t('events.previous')}
          </Button>
          <span>
            {t('events.page', { current: page + 1, total: data.totalPages })}
          </span>
          <Button
            variant="secondary"
            disabled={!data.hasNext}
            onClick={() => setParams({ page: String(page + 1) })}
          >
            {t('events.next')}
          </Button>
        </div>
      )}
    </Section>
  )
}

export function EventDetailPage() {
  const { t } = useTranslation()
  const { eventId } = useParams()
  const { state } = useLocation()
  const { data: member } = useMe()
  const from = state?.from
  const backTo =
    from === '/home' ||
    (typeof from === 'string' && /^\/events(?:\?[^#]*)?$/.test(from))
      ? from
      : '/events'

  return (
    <>
      <ScreenHeader
        title={t('events.detail')}
        back={{ to: backTo, label: t('common.back') }}
      />
      <PageBody className={styles.detail}>
        {eventId && /^[1-9]\d{0,18}$/.test(eventId) ? (
          member && (
            <EventDetailContent memberId={member.id} eventId={eventId} />
          )
        ) : (
          <Muted>{t('events.notFound')}</Muted>
        )}
      </PageBody>
    </>
  )
}

function EventDetailContent({
  memberId,
  eventId,
}: {
  memberId: number
  eventId: string
}) {
  const { t } = useTranslation()
  const query = useEventDetail(memberId, eventId)
  if (query.error instanceof ApiError && query.error.status === 404)
    return <Muted>{t('events.notFound')}</Muted>

  if (!query.data)
    return (
      <EventQueryNotice
        pending={query.isPending}
        fetching={query.isFetching}
        retry={() => void query.refetch()}
      />
    )

  return <EventDetails event={query.data} />
}

function EventDetails({ event }: { event: EventDetail }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const dates = formatEventDates(event, language)
  const times = formatEventTimes(event, language)
  const applicationUrl = eventLink(event.applicationUrl)
  const sourceUrl = eventLink(event.sourceUrl)
  const deadlineDate = new Date(event.applicationDeadline ?? '')
  const deadline = Number.isFinite(deadlineDate.getTime())
    ? new Intl.DateTimeFormat(language, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Seoul',
      }).format(deadlineDate)
    : null

  return (
    <>
      <div className={styles.cover} aria-hidden="true">
        <EventImage url={event.thumbnailUrl} />
      </div>
      {(event.multicultural || !event.translated) && (
        <div className={styles.tags}>
          {event.multicultural && (
            <Tag tone="main">{t('events.multicultural')}</Tag>
          )}
          {!event.translated && (
            <Tag tone="warning">{t('events.translationPending')}</Tag>
          )}
        </div>
      )}
      <h2 className={styles.title} lang={event.language}>
        {event.title}
      </h2>
      <dl className={styles.facts}>
        <div>
          <dt>{t('events.date')}</dt>
          <dd>{dates ?? t('events.dateUnknown')}</dd>
          {(times || event.timeUnknown) && (
            <dd>{times || t('events.timeUnknown')}</dd>
          )}
        </div>
        {event.venue && (
          <div>
            <dt>{t('events.venue')}</dt>
            <dd lang={event.language}>{event.venue}</dd>
          </div>
        )}
        {event.priceInfo && (
          <div>
            <dt>{t('events.price')}</dt>
            <dd>{event.priceInfo}</dd>
          </div>
        )}
        {deadline && (
          <div>
            <dt>{t('events.deadline')}</dt>
            <dd>{deadline}</dd>
          </div>
        )}
        {event.description && (
          <div>
            <dt>{t('events.description')}</dt>
            <dd lang={event.language} className={styles.description}>
              {event.description}
            </dd>
          </div>
        )}
      </dl>
      {(applicationUrl || sourceUrl) && (
        <div className={styles.links}>
          {applicationUrl && (
            <a href={applicationUrl} target="_blank" rel="noopener noreferrer">
              {t('events.apply')}
            </a>
          )}
          {sourceUrl && sourceUrl !== applicationUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              {t('events.original')}
            </a>
          )}
        </div>
      )}
    </>
  )
}
