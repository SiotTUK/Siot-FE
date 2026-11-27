import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Navigate,
  useLocation,
  useNavigate,
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
import {
  isDateRangeValid,
  parseEventFilters,
  withEventFilters,
} from '@/features/events/event-filters'
import { eventDetailBackPath, isEventId } from '@/features/events/event-routes'
import { EventCard } from '@/features/events/ui/event-card'
import { EventImage } from '@/features/events/ui/event-image'
import { EventListFilters } from '@/features/events/ui/event-list-filters'
import { EventQueryNotice } from '@/features/events/ui/event-query-notice'
import { EventRecommendations } from '@/features/events/ui/event-recommendations'
import { EventSubscription } from '@/features/events/ui/event-subscription'
import { EventReport } from '@/features/events/ui/event-report'
import { useEventDetail, useEvents } from '@/features/events/use-events'
import { ApiError } from '@/shared/api/client'
import { currentLanguage } from '@/shared/i18n'
import { Button, ButtonLink } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/field'
import { PageBody } from '@/shared/ui/mobile-frame'
import { FormError, Muted, PageHeading, Section, Tag } from '@/shared/ui/page'
import { ScreenHeader } from '@/shared/ui/screen-header'
import { shareEvent } from '@/features/events/share-event'
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
  const filters = parseEventFilters(params)
  const rangeValid = isDateRangeValid(filters)
  const query = useEvents(memberId, page, filters)
  const data = query.data
  const lastPage = data ? Math.max(0, data.totalPages - 1) : page
  const rangeRejected =
    query.error instanceof ApiError &&
    query.error.status === 400 &&
    query.error.code === 'INVALID_INPUT' &&
    Boolean(filters.from || filters.to)

  const pageParams = (nextPage: number) => {
    const nextParams = new URLSearchParams(params)
    if (nextPage === 0) nextParams.delete('page')
    else nextParams.set('page', String(nextPage))
    return nextParams
  }

  const filterArea = (
    <EventListFilters
      filters={filters}
      onChange={(next) =>
        setParams(withEventFilters(params, next), { preventScrollReset: true })
      }
    />
  )

  if (query.isSuccess && page > lastPage) {
    return (
      <Section title={t('events.all')}>
        {filterArea}
        <EventQueryNotice
          pending
          fetching={query.isFetching}
          retry={() => void query.refetch()}
        />
        {!query.isFetching && (
          <Navigate replace to={{ search: pageParams(lastPage).toString() }} />
        )}
      </Section>
    )
  }

  return (
    <Section title={t('events.all')}>
      {filterArea}
      {!rangeValid ? null : rangeRejected ? (
        <FormError message={t('events.invalidRange')} />
      ) : query.isPending || query.isError ? (
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
        <Muted>
          {filters.from || filters.to
            ? t('events.emptyFiltered')
            : t(`events.emptyStatus.${filters.status}`)}
        </Muted>
      )}
      {rangeValid && data && (page > 0 || data.hasNext) && (
        <div className={styles.pager}>
          <Button
            variant="secondary"
            disabled={page === 0}
            onClick={() => setParams(pageParams(page - 1))}
          >
            {t('events.previous')}
          </Button>
          <span>
            {t('events.page', { current: page + 1, total: data.totalPages })}
          </span>
          <Button
            variant="secondary"
            disabled={!data.hasNext}
            onClick={() => setParams(pageParams(page + 1))}
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
  const navigate = useNavigate()
  const { data: member } = useMe()
  const from = state?.from

  return (
    <>
      <ScreenHeader
        title={t('events.detail')}
        back={
          from === 'calendar'
            ? { onClick: () => void navigate(-1), label: t('common.back') }
            : { to: eventDetailBackPath(from), label: t('common.back') }
        }
      />
      <PageBody className={styles.detail}>
        {isEventId(eventId) ? (
          member && (
            <EventDetailContent
              key={`${member.id}:${eventId}`}
              memberId={member.id}
              eventId={eventId}
            />
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

  return (
    <>
      <EventDetails event={query.data} />
      <EventSubscription
        event={query.data}
        memberId={memberId}
        initiallySubscribed={query.data.subscribed}
        alignActionsEnd
      />
      <EventActions event={query.data} />
      <EventReport event={query.data} memberId={memberId} />
    </>
  )
}

function EventDetails({ event }: { event: EventDetail }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const machineTranslated = event.translated && event.language !== 'ko'
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
      {(event.multicultural || !event.translated || machineTranslated) && (
        <div className={styles.tags}>
          {event.multicultural && (
            <Tag tone="main">{t('events.multicultural')}</Tag>
          )}
          {machineTranslated && (
            <Tag tone="main">{t('events.translationAutomatic')}</Tag>
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

function EventActions({ event }: { event: EventDetail }) {
  const { t } = useTranslation()
  const path = `/events/${event.eventId}`
  const url = new URL(path, window.location.origin).href
  const [shareStatus, setShareStatus] =
    useState<Awaited<ReturnType<typeof shareEvent>>>()
  return (
    <>
      <div className={styles.links}>
        <Button
          variant="secondary"
          onClick={async () =>
            setShareStatus(await shareEvent(event.title, url, navigator))
          }
        >
          {t('events.share')}
        </Button>
        <ButtonLink
          variant="secondary"
          to="/chat"
          state={{
            eventQuestionId: String(event.eventId),
            eventQuestionDraft: t('events.askDraft', { title: event.title }),
          }}
        >
          {t('events.ask')}
        </ButtonLink>
      </div>
      {shareStatus === 'copied' && (
        <div role="status">{t('events.shareCopied')}</div>
      )}
      {shareStatus === 'manual' && (
        <TextField
          label={t('events.shareManual')}
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
        />
      )}
    </>
  )
}
